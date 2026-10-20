/**
 * Mail sending module for the Build For Good mailing list.
 *
 * Sends bulk emails via Resend API (batched, max 50 per request).
 * Logs all sends to the `mail_sends` table for analytics and debugging.
 * Never throws — every network call is wrapped, so errors are logged and
 * swallowed. This keeps the mailing list deliverable even when one mail in a
 * batch fails.
 *
 * All functions accept `env` (the Cloudflare Workers environment) so the D1
 * database binding (`env.DB`) is passed at call time, matching the rest of the
 * Worker codebase.
 */

import { sendConfirmation } from "./notify.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Default "From" header used when env.NOTIFY_FROM is absent. */
export const DEFAULT_FROM = "Build For Good <notify@buildforgood.world>";

/** Mailbox cap per Resend request — avoids rate limits on bulk sends. */
const BATCH_SIZE = 50;

/**
 * Send one email via Resend to a single recipient.
 * Returns true on success, false otherwise (best-effort, never throws).
 *
 * @param {Record<string, string|undefined>} env
 * @param {{to: string, subject: string, html_body?: string}} opts
 * @returns {Promise<boolean>}
 */
async function resendOne(env, { to, subject, html_body }) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("mailing: no RESEND_API_KEY set, skipping:", to);
    return false;
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.NOTIFY_FROM || DEFAULT_FROM,
        to: [to],
        subject,
        html_body: html_body ?? "",
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("mailing: resend failed", err);
    return false;
  }
}

/**
 * Log a send record to the `mail_sends` table (best-effort).
 * Creates the row only if the table exists (e.g. migration not run yet).
 * Returns true if the log row was written, false otherwise.
 *
 * @param {Record<string, unknown>} env
 * @param {number|null} subscriberId
 * @param {string} subject
 * @param {string} bodyHtml
 * @param {string} sentAt
 * @returns {Promise<boolean>}
 */
async function logSend(env, subscriberId, subject, bodyHtml, sentAt) {
  if (!env.DB) return false;
  try {
    await env.DB.prepare(
      `INSERT INTO mail_sends (subscriber_id, subject, html_body, sent_at)
       VALUES (?, ?, ?, ?)`
    ).run(subscriberId, subject, bodyHtml, sentAt);
    return true;
  } catch (err) {
    // Table may not exist yet; ignore gracefully.
    console.error("mailing: failed to log send:", err?.message ?? err);
    return false;
  }
}

/**
 * Count active subscribers from D1.
 *
 * @param {Record<string, unknown>} env
 * @returns {Promise<number>}
 */
async function countActiveSubscribers(env) {
  if (!env.DB) return 0;
  try {
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM subscribers WHERE status = 'active'`
    ).first();
    return Number(row?.n || 0);
  } catch {
    return 0;
  }
}

/**
 * Mass-send an email to every active subscriber.
 *
 * - Pulls all active subscriber rows in batches (so we never hold the whole
 *   result set at once).
 * - Each subscriber receives a single Resend email; batched internally up to
 *   `BATCH_SIZE` recipients per call.
 * - Every individual send is best-effort; failures are logged but do not throw.
 * - Each send is logged to `mail_sends`.
 *
 * @param {Record<string, unknown>} env
 * @param {{subject: string, html_body: string, text_body?: string}} params
 * @param {{onProgress?: (sent: number, total: number) => void}=} options
 * @returns {Promise<{totalSent: number, totalFailed: number, totalActive: number}>}
 */
export async function sendToAll(env, params, options = {}) {
  const { subject, html_body } = params;
  const onProgress = options.onProgress || (() => {});

  // Test whether the subscribers table is even present. If not, we can't send
  // anywhere and nobody needs the email anymore.
  if (!env.DB) return { totalSent: 0, totalFailed: 0, totalActive: 0 };

  let offset = 0;
  let sent = 0;
  let failed = 0;

  // Paginate through active subscribers — SQLite LIMIT/OFFSET. Stop when a
  // batch returns fewer rows than requested (end of list).
  while (offset < 10000) {
    const batch = await env.DB.prepare(
      `SELECT id, email FROM subscribers
       WHERE status = 'active'
       LIMIT ? OFFSET ?`
    )
      .bind(BATCH_SIZE, offset)
      .all();

    const rows = batch.results ?? [];
    if (rows.length === 0) break;

    for (const sub of rows) {
      const ok = await resendOne(env, {
        to: sub.email,
        subject,
        html_body,
      });
      await logSend(env, sub.id, subject, html_body, new Date().toISOString());
      if (ok) sent++;
      else failed++;
      onProgress(sent, offset + rows.length);
    }

    offset += rows.length;
    if (rows.length < BATCH_SIZE) break;
  }

  const active = await countActiveSubscribers(env);
  return { totalSent: sent, totalFailed: failed, totalActive: active };
}

/**
 * Best-effort acknowledgement that a subscriber joined the list. Thin wrapper
 * over notify.js#sendConfirmation. No-op without env config.
 *
 * @param {Record<string, string|undefined>} env
 * @param {ExecutionContext} ctx
 * @param {{email?: string, type: string}} opts
 */
export function notifyListOwner(env, ctx, opts) {
  if (opts?.email) sendConfirmation(env, ctx, { email: opts.email, type: opts.type || "list_update" });
}
