/**
 * Client-side mirror of the Worker's input rules.
 *
 * These constants and predicates are copied from `worker/lib/validate.js` and
 * the per-field limits in `worker/routes/public.js` so the browser rejects
 * exactly what the API would — no "looks fine here, 422 there" surprises.
 * Prefer answering the form here, and leave the server as the source of truth.
 */

/* ------------------------------------------------------------------ */
/* Length caps (match the `clean(value, max)` calls on the server)      */
/* ------------------------------------------------------------------ */

export const MAX_NAME = 120;
export const MAX_EMAIL = 254;
export const MAX_LOCATION = 160;
export const MAX_DISCIPLINES = 500;
export const MAX_LINKS = 1000;
export const MAX_REFERRAL = 200;
export const MAX_BUILDING = 5000;
export const MAX_STRUGGLING = 5000;
export const MAX_WHY_BGET = 5000;

export const MAX_TITLE = 200;
export const MAX_DESCRIPTION = 8000;
/** shared cap for affected / tried / success_looks_like / why_bget / contribution */
export const MAX_PROBLEM_LONG = 4000;

export const MAX_SUBJECT = 200;
export const MAX_MESSAGE = 8000;

export const MAX_TOPIC = 200;
export const MAX_SUGGESTION_BODY = 8000;

export const MAX_FEEDBACK_BODY = 8000;
export const MAX_PAGE = 300;

/* ------------------------------------------------------------------ */
/* Minimums (match the `fieldProblems(...)` limits on the server)      */
/* ------------------------------------------------------------------ */

export const MIN_APPLY_NAME = 2;
export const MIN_BUILDING = 10;
export const MIN_PROBLEM_TITLE = 4;
export const MIN_PROBLEM_DESCRIPTION = 20;
export const MIN_CONTACT_NAME = 2;
export const MIN_CONTACT_MESSAGE = 10;
export const MIN_TOPIC = 3;
export const MIN_SUGGESTION_BODY = 4;
export const MIN_FEEDBACK_BODY = 2;

/** URLs tolerated per field before the server rejects with `link_flood`. */
export const MAX_LINKS_PER_FIELD = 5;

/* ------------------------------------------------------------------ */
/* Predicates                                                          */
/* ------------------------------------------------------------------ */

/**
 * Deliberately conservative email check, mirroring the Worker's `isEmail`:
 * bounded local part and a dotted domain whose labels are each LDH-shaped,
 * ending in an alphabetic TLD. Not RFC 5322 — just enough to reject the
 * obvious junk the server rejects.
 */
export function isEmail(value: string): boolean {
  const s = value.trim();
  if (s.length < 6 || s.length > MAX_EMAIL) return false;
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

const LINK_RE = /(?:https?:\/\/|www\.)[^\s<>()"']+/gi;

/** Count link-ish tokens (`http(s)://…` or `www.…`) in a value. */
export function countUrls(value: string): number {
  const matches = value.match(LINK_RE);
  return matches ? matches.length : 0;
}

/**
 * Names of fields carrying more than `MAX_LINKS_PER_FIELD` links. Mirrors the
 * server's `linkFloodFields` so link-spam is caught before the round trip.
 */
export function linkFloodFields(fields: Record<string, string>): string[] {
  return Object.entries(fields)
    .filter(([, value]) => typeof value === "string" && countUrls(value) > MAX_LINKS_PER_FIELD)
    .map(([name]) => name);
}

/** Human-readable names for API field keys, used for error copy. */
export const FIELD_LABELS: Record<string, string> = {
  name: "name",
  email: "email address",
  building: "answer",
  title: "title",
  description: "description",
  message: "message",
  topic: "topic",
  body: "answer",
  subject: "subject",
  page: "page",
  visibility: "visibility",
  rating: "rating",
  submitter_name: "name",
  company: "field",
  website: "field",
};
