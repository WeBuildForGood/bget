/**
 * Best-effort forwarding of submissions to the Navrix core (`swnk-core`).
 *
 * Build For Good is a "connected site" in the Navrix multi-tenant core: every
 * contact message and newsletter signup is mirrored to the core so it appears
 * in the Navrix Control Centre (Contacts / Subscribers, filtered by site).
 *
 * The local D1 copy remains the source of truth for this site; forwarding is
 * strictly best-effort and NEVER fails a submission. Signed requests must match
 * the core's verifier exactly (`swnk-core/src/middleware/hmac-verify.ts`):
 *
 *   headers  x-swnk-site-id, x-swnk-timestamp, x-swnk-nonce, x-swnk-signature
 *   message  `POST\n{path}\n{timestamp}\n{nonce}\n{sha256hex(rawBody)}`
 *   signature hex(HMAC-SHA256(secret, message))
 *
 * Configuration (all three required; forwarding is skipped when any is absent —
 * set with `wrangler secret put`):
 *   CORE_API_BASE_URL  e.g. "https://swnk-core.shadownik.workers.dev"
 *   CORE_SITE_ID       e.g. "bget"
 *   CORE_SITE_SECRET   the site's shared HMAC secret
 */

const DEFAULT_TIMEOUT_MS = 8000;

/** Lowercase hex of an ArrayBuffer. */
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** SHA-256 of a string, as lowercase hex. Exported for lib/notify.js. */
export async function sha256Hex(input) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return bufferToHex(digest);
}

/**
 * HMAC-SHA256 of a string with a secret, as lowercase hex.
 * Exported so lib/notify.js can sign the NOTIFY_WEBHOOK payload with the same
 * scheme.
 */
export async function hmacSignHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return bufferToHex(signature);
}

/** True when the core connection is fully configured. */
export function coreConfigured(env) {
  return Boolean(
    env && env.CORE_API_BASE_URL && env.CORE_SITE_ID && env.CORE_SITE_SECRET,
  );
}

/**
 * Fire-and-forget a signed POST to the core. A no-op when the core is not
 * configured, and never throws.
 *
 * @param {{CORE_API_BASE_URL?: string, CORE_SITE_ID?: string,
 *   CORE_SITE_SECRET?: string}} env
 * @param {ExecutionContext} ctx
 * @param {string} path Core pathname, e.g. "/v1/public/contact"
 * @param {Record<string, unknown>} payload JSON body
 * @returns {void}
 */
export function forwardToCore(env, ctx, path, payload) {
  if (!coreConfigured(env)) return;
  const task = deliver(env, path, payload).catch((err) => {
    console.error("core: forward failed", path, err);
  });
  if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(task);
}

/**
 * Deliver one signed request to the core.
 *
 * @param {Record<string, string>} env
 * @param {string} path
 * @param {Record<string, unknown>} payload
 * @returns {Promise<void>}
 */
async function deliver(env, path, payload) {
  const base = String(env.CORE_API_BASE_URL).replace(/\/+$/, "");
  const url = `${base}${path}`;
  const body = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const bodyHash = await sha256Hex(body);
  const message = `POST\n${path}\n${timestamp}\n${nonce}\n${bodyHash}`;
  const signature = await hmacSignHex(env.CORE_SITE_SECRET, message);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-swnk-site-id": env.CORE_SITE_ID,
        "x-swnk-timestamp": timestamp,
        "x-swnk-nonce": nonce,
        "x-swnk-signature": signature,
      },
      body,
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("core: forward non-2xx", path, response.status, detail.slice(0, 300));
    }
  } finally {
    clearTimeout(timer);
  }
}
