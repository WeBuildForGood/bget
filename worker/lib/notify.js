/**
 * Best-effort outbound notifications for successful submissions.
 *
 * A submission is never failed because a notification failed: every network
 * call is wrapped, and errors are logged and swallowed. Transports are tried in
 * order, using whichever is configured:
 *
 *   1. NOTIFY_WEBHOOK                — POST a compact JSON body to an arbitrary
 *                                      URL, HMAC-signed with CORE_SITE_SECRET
 *                                      (see `deliver()` — same scheme as the
 *                                      core forwarder in ./core.js).
 *   2. RESEND_API_KEY + NOTIFY_EMAIL — send an alert email via Resend's HTTP API.
 *   3. (otherwise)                   — a single console.log line (see `wrangler tail`).
 *
 * `sendConfirmation()` uses the same Resend transport to acknowledge a
 * submitter directly, when we have both an address and a key. See wrangler.toml
 * for the full, optional variable list.
 */

import { hmacSignHex, sha256Hex } from "./core.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Build For Good <notify@buildforgood.world>";

/** Human labels per submission type. */
const LABELS = {
  application: "application",
  problem: "problem",
  project: "project",
  contact: "contact message",
  suggestion: "suggestion",
  feedback: "feedback",
};

/**
 * Fire-and-forget a notification for a successful submission.
 *
 * @param {{NOTIFY_WEBHOOK?: string, RESEND_API_KEY?: string, NOTIFY_EMAIL?: string,
 *   NOTIFY_FROM?: string, CORE_SITE_SECRET?: string, CORE_SITE_ID?: string}} env
 * @param {ExecutionContext} ctx
 * @param {{type: string, id?: number|null, summary?: string,
 *   data?: Record<string, unknown>}} payload
 * @returns {void}
 */
export function notifySubmission(env, ctx, payload) {
  const task = deliver(env, payload).catch((err) => {
    console.error("notify: delivery failed", err);
  });
  if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(task);
}

/**
 * Fire-and-forget a short acknowledgement to a submitter, when we have both an
 * address and a Resend key. Never throws and never blocks the response.
 *
 * @param {{RESEND_API_KEY?: string, NOTIFY_FROM?: string}} env
 * @param {ExecutionContext} ctx
 * @param {{email?: string|null, type: string}} opts
 * @returns {void}
 */
export function sendConfirmation(env, ctx, { email, type }) {
  if (!env.RESEND_API_KEY || !email) return;
  const task = deliverConfirmation(env, { email, type }).catch((err) => {
    console.error("notify: confirmation failed", err);
  });
  if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(task);
}

/**
 * Deliver one alert through the first configured transport.
 *
 * When `NOTIFY_WEBHOOK` is used, the POST is HMAC-signed with
 * `CORE_SITE_SECRET` (see the webhook branch in this function).
 *
 * @param {Record<string, string|undefined>} env
 * @param {{type: string, id?: number|null, summary?: string,
 *   data?: Record<string, unknown>}} payload
 * @returns {Promise<void>}
 */
async function deliver(env, payload) {
  const type = String(payload.type || "submission");
  const id = payload.id ?? null;
  const summary = String(payload.summary || "").slice(0, 400);
  const data = payload.data && typeof payload.data === "object" ? payload.data : {};
  const label = LABELS[type] || type;
  const at = new Date().toISOString();

  if (env.NOTIFY_WEBHOOK) {
    const body = JSON.stringify({ type, id, at, summary, data });
    const headers = { "content-type": "application/json" };

    // Sign the outbound payload so the receiver can verify it really came
    // from this Worker and was not tampered with in transit. The message and
    // headers mirror the core-forwarder scheme in ./core.js, so a receiver
    // can reuse the same verification logic:
    //   message  `POST\n{path}\n{timestamp}\n{nonce}\n{sha256hex(rawBody)}`
    //   headers  x-swnk-timestamp, x-swnk-nonce, x-swnk-signature
    //            (+ x-swnk-site-id when CORE_SITE_ID is set)
    //   signature hex(HMAC-SHA256(CORE_SITE_SECRET, message))
    // Without CORE_SITE_SECRET there is nothing to sign with; that is logged
    // loudly rather than silently sending unsigned PII.
    if (env.CORE_SITE_SECRET) {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonce = crypto.randomUUID().replace(/-/g, "");
      const path = new URL(String(env.NOTIFY_WEBHOOK)).pathname;
      const bodyHash = await sha256Hex(body);
      const message = `POST\n${path}\n${timestamp}\n${nonce}\n${bodyHash}`;
      headers["x-swnk-timestamp"] = timestamp;
      headers["x-swnk-nonce"] = nonce;
      headers["x-swnk-signature"] = await hmacSignHex(env.CORE_SITE_SECRET, message);
      if (env.CORE_SITE_ID) headers["x-swnk-site-id"] = env.CORE_SITE_ID;
    } else {
      console.error(
        "[NOTIFY_WEBHOOK_UNSIGNED] CORE_SITE_SECRET is not set; " +
          "webhook sent without an HMAC signature",
      );
    }

    const res = await fetch(String(env.NOTIFY_WEBHOOK), {
      method: "POST",
      headers,
      body,
    });
    if (!res.ok) console.error(`notify: webhook responded ${res.status}`);
    return;
  }

  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.NOTIFY_FROM || DEFAULT_FROM,
        to: [String(env.NOTIFY_EMAIL)],
        subject: `[Build For Good] New ${label}${id ? ` #${id}` : ""}`,
        text: alertText(label, id, summary, data),
      }),
    });
    if (!res.ok) console.error(`notify: resend responded ${res.status}`);
    return;
  }

  console.log(
    `notify: new ${label}${id ? ` #${id}` : ""}${summary ? ` — ${summary}` : ""}`,
  );
}

/**
 * Send a short acknowledgement email to a submitter.
 *
 * @param {{RESEND_API_KEY?: string, NOTIFY_FROM?: string}} env
 * @param {{email: string, type: string}} opts
 * @returns {Promise<void>}
 */
async function deliverConfirmation(env, { email, type }) {
  const label = LABELS[type] || type;
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.NOTIFY_FROM || DEFAULT_FROM,
      to: [String(email)],
      subject: "We received your submission — Build For Good",
      text:
        `Thank you for your ${label}. It reached Build For Good and a person ` +
        `will read it.\n\nWe reply to every constructive submission within ` +
        `72 hours — framed, parked, or declined with a reason.\n\n` +
        `— Build For Good\nhttps://buildforgood.world`,
    }),
  });
  if (!res.ok) console.error(`notify: confirmation responded ${res.status}`);
}

/**
 * Build the plain-text body of an alert email.
 *
 * @param {string} label
 * @param {number|null} id
 * @param {string} summary
 * @param {Record<string, unknown>} data
 * @returns {string}
 */
function alertText(label, id, summary, data) {
  const lines = [`New ${label}${id ? ` #${id}` : ""}`, ""];
  if (summary) lines.push(summary, "");
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === "") continue;
    lines.push(`${key}: ${String(value).slice(0, 2000)}`);
  }
  lines.push("", "Review in the admin console: https://buildforgood.world/admin");
  return lines.join("\n");
}
