/**
 * Input validation / sanitisation helpers.
 *
 * All user-supplied values pass through `clean()` (control-char strip + trim +
 * hard length cap) before they reach a bound SQL parameter, and every query in
 * this Worker uses bound parameters — never string interpolation.
 *
 * `minLen` / `maxLen` are small predicates used by the route handlers to reject
 * content that is obviously empty or absurdly long, and `linkFloodFields()`
 * blocks link-spam submissions before they reach the database.
 */

/** Reject request bodies larger than this (100 KiB). */
export const MAX_BODY_BYTES = 100 * 1024;

/** Maximum number of URLs tolerated in any single field. */
export const MAX_LINKS_PER_FIELD = 5;

/**
 * C0/C1 control characters that carry no meaning in form text. Tab (0x09) and
 * newline (0x0A) are preserved because textareas rely on them.
 */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Matches a link-ish token, with or without a scheme. */
const LINK_RE = /(?:https?:\/\/|www\.)[^\s<>()"']+/gi;

/**
 * Normalise line endings and drop non-printing control characters.
 * Non-strings become "".
 *
 * @param {unknown} value
 * @returns {string}
 */
export function stripControl(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n").replace(CONTROL_CHARS, "");
}

/**
 * Trim a value, strip control characters, and cap its length. Non-strings
 * become "".
 *
 * @param {unknown} value Raw input.
 * @param {number} max Maximum number of characters to keep.
 * @returns {string}
 */
export function clean(value, max = 2000) {
  return stripControl(value).trim().slice(0, Math.max(0, max));
}

/**
 * True when `value` is a string of at least `min` characters (after trim).
 * Non-strings never satisfy a positive minimum.
 *
 * @param {unknown} value
 * @param {number} min
 * @returns {boolean}
 */
export function minLen(value, min) {
  return typeof value === "string" && value.trim().length >= Math.max(0, min);
}

/**
 * True when `value` is short enough to accept. Non-strings pass (they carry no
 * length), so callers combine this with `minLen` for required fields.
 *
 * @param {unknown} value
 * @param {number} max
 * @returns {boolean}
 */
export function maxLen(value, max) {
  return typeof value !== "string" || value.length <= Math.max(0, max);
}

/**
 * Pragmatic, conservative email check: a bounded local part and a dotted domain
 * with an alphabetic TLD. Rejects the obvious junk (`a@b`, `a@b.c`,
 * `a..b@c.com`, anything with whitespace) without pretending to be
 * RFC 5322-complete.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isEmail(value) {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (s.length < 6 || s.length > 254) return false;
  const at = s.lastIndexOf("@");
  if (at < 1 || at === s.length - 1) return false;
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (!local || local.length > 64) return false;
  if (!domain || domain.length > 253) return false;
  if (s.includes("..")) return false;
  if (local.startsWith(".") || local.endsWith(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;
  const labels = domain.split(".");
  for (const label of labels) {
    if (!/^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label)) return false;
  }
  const tld = labels[labels.length - 1];
  return /^[A-Za-z]{2,}$/.test(tld);
}

/**
 * Count link-ish tokens (`http(s)://…` or `www.…`) in a value.
 *
 * @param {unknown} value
 * @returns {number}
 */
export function countUrls(value) {
  if (typeof value !== "string" || !value) return 0;
  const matches = value.match(LINK_RE);
  return matches ? matches.length : 0;
}

/**
 * Names of fields containing more than `max` links. Used to reject link-spam
 * submissions (e.g. a "description" that is really a list of URLs).
 *
 * @param {Record<string, unknown>} fields
 * @param {number} [max]
 * @returns {string[]}
 */
export function linkFloodFields(fields, max = MAX_LINKS_PER_FIELD) {
  if (!fields || typeof fields !== "object") return [];
  return Object.entries(fields)
    .filter(([, value]) => countUrls(value) > max)
    .map(([name]) => name);
}

/**
 * Coerce a value to an integer bounded by `min`/`max`.
 * Returns `fallback` when the input is missing or out of range.
 *
 * @param {unknown} value
 * @param {{min?: number|null, max?: number|null, fallback?: number|null}} [opts]
 * @returns {number|null}
 */
export function asInt(value, { min = null, max = null, fallback = null } = {}) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  if (min !== null && i < min) return fallback;
  if (max !== null && i > max) return fallback;
  return i;
}

/**
 * Read and parse a request body, enforcing the 100 KiB cap.
 *
 * Supports `application/json` (the API contract) and, as a convenience,
 * `application/x-www-form-urlencoded` form posts.
 *
 * @param {Request} request
 * @returns {Promise<{ok: true, body: Record<string, unknown>}
 *   | {ok: false, status: number, error: string}>}
 */
export async function readBody(request) {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: "payload_too_large" };
  }

  let text;
  try {
    text = await request.text();
  } catch {
    return { ok: false, status: 400, error: "invalid_body" };
  }

  // Guard against a missing/understated Content-Length header.
  if (text.length > MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: "payload_too_large" };
  }
  if (!text) return { ok: true, body: {} };

  try {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const body = {};
      for (const [key, value] of new URLSearchParams(text)) body[key] = value;
      return { ok: true, body };
    }
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, status: 400, error: "invalid_json" };
    }
    return { ok: true, body: parsed };
  } catch {
    return { ok: false, status: 400, error: "invalid_json" };
  }
}

/**
 * Honeypot check. Forms include a hidden `company` (or legacy `website`) field;
 * only bots fill it in. When tripped we return a fake success and skip the write.
 *
 * @param {Record<string, unknown>} body
 * @returns {boolean}
 */
export function isHoneypot(body) {
  return Boolean(clean(body.company, 100) || clean(body.website, 100));
}

/**
 * Collect the names of required fields that are empty, for a helpful 422 body.
 *
 * @param {Record<string, string>} fields
 * @returns {string[]}
 */
export function missingFields(fields) {
  return Object.entries(fields)
    .filter(([, value]) => !value)
    .map(([name]) => name);
}
