/**
 * Cloudflare Access JWT verification.
 *
 * Admin routes are protected by Cloudflare Access (Zero Trust). Access injects
 * a signed JWT into the `Cf-Access-Jwt-Assertion` header after a user has
 * authenticated. We verify it locally against the team's public JWKS so that
 * the Worker can authorise requests without an extra round trip.
 *
 * Required environment variables (set with `wrangler secret put`):
 *   ACCESS_TEAM_DOMAIN — e.g. "myteam.cloudflareaccess.com" (protocol optional)
 *   ACCESS_AUD         — the Access application's Audience (AUD) tag
 *
 * SECURITY: if either variable is missing we treat Access as unconfigured and
 * FAIL CLOSED — every admin request is rejected with 401. This is the safe
 * default so an accidentally unconfigured deployment cannot expose admin data.
 */

const JWKS_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLOCK_SKEW_SECONDS = 60;

/**
 * Module-level JWKS cache. Workers reuse isolates between requests, so this
 * avoids a JWKS fetch on every admin call. Keyed by JWKS URL so a change in
 * `ACCESS_TEAM_DOMAIN` invalidates the cache.
 * @type {{url: string, keys: object[]|null, expiresAt: number}}
 */
let jwksCache = { url: "", keys: null, expiresAt: 0 };

/**
 * Normalise the configured team domain into an origin URL.
 * Accepts "team.cloudflareaccess.com" or "https://team.cloudflareaccess.com".
 *
 * @param {string} value
 * @returns {string|null}
 */
function normaliseTeamDomain(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

/** Decode a base64url string into bytes. */
function base64UrlToBytes(input) {
  let s = String(input).replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  s += "=".repeat(pad);
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Decode a base64url JWT segment into a parsed JSON object. */
function decodeJsonSegment(segment) {
  const text = new TextDecoder().decode(base64UrlToBytes(segment));
  return JSON.parse(text);
}

/**
 * Fetch (and cache) the team's JWKS.
 *
 * @param {string} teamDomain Normalised origin, e.g. https://team.cloudflareaccess.com
 * @returns {Promise<object[]|null>}
 */
async function getJwks(teamDomain) {
  const url = `${teamDomain}/cdn-cgi/access/certs`;
  const now = Date.now();

  if (jwksCache.url === url && jwksCache.keys && jwksCache.expiresAt > now) {
    return jwksCache.keys;
  }

  const res = await fetch(url, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!res.ok) return null;

  const data = await res.json();
  const keys = Array.isArray(data?.keys) ? data.keys : null;
  if (!keys || !keys.length) return null;

  jwksCache = { url, keys, expiresAt: now + JWKS_TTL_MS };
  return keys;
}

/**
 * Verify the signature of a compact JWS (RS256) with a JWK.
 *
 * @param {string} header Encoded header segment.
 * @param {string} payload Encoded payload segment.
 * @param {string} signature Encoded signature segment.
 * @param {object} jwk The public key.
 * @returns {Promise<boolean>}
 */
async function verifySignature(header, payload, signature, jwk) {
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sig = base64UrlToBytes(signature);
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, data);
}

/**
 * Verify a Cloudflare Access assertion from the incoming request.
 *
 * @param {Request} request
 * @param {Record<string, string|undefined>} env
 * @returns {Promise<{ok: true, email: string, service?: boolean} | {ok: false, reason: string}>}
 */
export async function verifyAccess(request, env) {
  const teamDomain = normaliseTeamDomain(env.ACCESS_TEAM_DOMAIN);
  const audience = String(env.ACCESS_AUD || "").trim();

  // Fail closed when Access is not configured.
  if (!teamDomain || !audience) {
    return { ok: false, reason: "not_configured" };
  }

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return { ok: false, reason: "missing_token" };

  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed_token" };
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  let header;
  let claims;
  try {
    header = decodeJsonSegment(encodedHeader);
    claims = decodeJsonSegment(encodedPayload);
  } catch {
    return { ok: false, reason: "malformed_token" };
  }

  if (header?.alg !== "RS256") return { ok: false, reason: "unsupported_alg" };

  // --- Signature ---------------------------------------------------------
  let keys;
  try {
    keys = await getJwks(teamDomain);
  } catch {
    return { ok: false, reason: "jwks_fetch_failed" };
  }
  if (!keys) return { ok: false, reason: "jwks_unavailable" };

  const jwk = header.kid
    ? keys.find((k) => k.kid === header.kid)
    : keys.length === 1
      ? keys[0]
      : null;
  if (!jwk) return { ok: false, reason: "unknown_key" };

  let signatureValid = false;
  try {
    signatureValid = await verifySignature(
      encodedHeader,
      encodedPayload,
      encodedSignature,
      jwk,
    );
  } catch {
    return { ok: false, reason: "signature_error" };
  }
  if (!signatureValid) return { ok: false, reason: "invalid_signature" };

  // --- Claims ------------------------------------------------------------
  const now = Math.floor(Date.now() / 1000);

  // Cloudflare Access ALWAYS issues `exp` (and `iss`) — on interactive
  // logins AND service-token assertions alike — so a signature-valid token
  // missing either is not an Access token. Reject rather than trust: the old
  // "check only if present" logic accepted a token without `exp` forever.
  if (typeof claims.exp !== "number" || !Number.isFinite(claims.exp)) {
    return { ok: false, reason: "missing_exp" };
  }
  if (claims.exp < now - CLOCK_SKEW_SECONDS) {
    return { ok: false, reason: "expired" };
  }
  if (typeof claims.nbf === "number" && claims.nbf > now + CLOCK_SKEW_SECONDS) {
    return { ok: false, reason: "not_yet_valid" };
  }

  const audClaim = claims.aud;
  const audOk = Array.isArray(audClaim)
    ? audClaim.includes(audience)
    : audClaim === audience;
  if (!audOk) return { ok: false, reason: "invalid_audience" };

  // The issuer must be THIS team's Access domain. Access tokens carry
  // `iss: "https://<team>.cloudflareaccess.com"` (no trailing slash), which
  // matches the normalised `teamDomain` above (e.g.
  // "https://shadownik.cloudflareaccess.com"). A missing `iss` is rejected
  // too — previously any truthy-or-absent issuer passed.
  if (typeof claims.iss !== "string" || claims.iss !== teamDomain) {
    return { ok: false, reason: "invalid_issuer" };
  }

  // Interactive logins carry an `email` claim. A Cloudflare Access *service
  // token* (machine-to-machine) carries neither `email` nor a usable `sub`
  // (Access sets `sub` to the empty string) — its identity is `common_name`.
  // Accept all three so the Navrix dashboard (via a service token) can call
  // this API alongside humans signing in through Access.
  const email =
    (typeof claims.email === "string" && claims.email) ||
    (typeof claims.sub === "string" && claims.sub) ||
    (typeof claims.common_name === "string" && claims.common_name) ||
    "";
  if (!email) return { ok: false, reason: "missing_identity" };

  const isServiceToken = claims.type === "app" || typeof claims.common_name === "string";

  return { ok: true, email, service: isServiceToken };
}

/** Exposed for tests / diagnostics. */
export function _resetJwksCache() {
  jwksCache = { url: "", keys: null, expiresAt: 0 };
}
