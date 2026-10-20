/**
 * Unit tests for worker/lib/validate.js — input validation / sanitisation.
 *
 * Run with the built-in Node test runner (no dependencies):
 *   node --test tests/
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_BODY_BYTES,
  MAX_LINKS_PER_FIELD,
  clean,
  stripControl,
  minLen,
  maxLen,
  isEmail,
  countUrls,
  linkFloodFields,
  asInt,
  readBody,
  isHoneypot,
  missingFields,
} from "../worker/lib/validate.js";

// ---------------------------------------------------------------------------
// required-field checks
// ---------------------------------------------------------------------------
test("missingFields: returns names of empty/falsy fields only", () => {
  const missing = missingFields({
    title: "Build a thing",
    description: "",
    contact: null,
    email: undefined,
    owner: "Nikhil",
  });
  assert.deepEqual(missing, ["description", "contact", "email"]);
});

test("missingFields: empty object yields no missing fields", () => {
  assert.deepEqual(missingFields({}), []);
});

// ---------------------------------------------------------------------------
// minLen / maxLen length limits
// ---------------------------------------------------------------------------
test("minLen: enforces a minimum after trimming", () => {
  assert.equal(minLen("abc", 3), true);
  assert.equal(minLen("  abc  ", 3), true);
  assert.equal(minLen("ab", 3), false);
  assert.equal(minLen("   ", 1), false);
  assert.equal(minLen("", 0), true);
});

test("minLen: non-strings never satisfy a positive minimum", () => {
  assert.equal(minLen(5, 1), false);
  assert.equal(minLen(null, 1), false);
  assert.equal(minLen(undefined, 1), false);
});

test("maxLen: rejects only over-long strings; non-strings pass", () => {
  assert.equal(maxLen("abcd", 4), true);
  assert.equal(maxLen("abcde", 4), false);
  assert.equal(maxLen(123456, 4), true, "non-strings carry no length");
  assert.equal(maxLen(null, 4), true);
  assert.equal(maxLen(undefined, 4), true);
});

// ---------------------------------------------------------------------------
// email validity
// ---------------------------------------------------------------------------
test("isEmail: accepts ordinary, plus-tagged and dotted-domain addresses", () => {
  for (const valid of [
    "user@example.com",
    "first.last@example.com",
    "first+tag@sub.example.co",
    "a_b-c@my-domain.example.org",
  ]) {
    assert.equal(isEmail(valid), true, `expected ${valid} to be valid`);
  }
});

test("isEmail: rejects junk without a plausible TLD", () => {
  for (const invalid of [
    "a@b",
    "a@b.c",
    "user@example.123",
    "@example.com",
    "user@",
    "user name@example.com",
    "user@exa mple.com",
    "user@@example.com",
  ]) {
    assert.equal(isEmail(invalid), false, `expected ${invalid} to be invalid`);
  }
});

test("isEmail: documents current leniency toward a long dotless domain", () => {
  // NOTE: the implementation requires an alphabetic TLD but not a dot, so a
  // sufficiently long single-label domain is currently accepted. Captured here
  // so a future tightening of the rule fails loudly instead of silently.
  assert.equal(isEmail("user@example"), true);
});

test("isEmail: rejects consecutive dots", () => {
  assert.equal(isEmail("a..b@example.com"), false);
  assert.equal(isEmail("user@example..com"), false);
});

test("isEmail: rejects leading/trailing hyphens in domain labels", () => {
  assert.equal(isEmail("user@-example.com"), false, "leading hyphen label");
  assert.equal(isEmail("user@example-.com"), false, "trailing hyphen label");
  assert.equal(isEmail("user@sub.-example.com"), false, "leading hyphen in sub-label");
  assert.equal(isEmail("user@sub-.example.com"), false, "trailing hyphen in sub-label");
  // Hyphens mid-label are fine.
  assert.equal(isEmail("user@my-domain.com"), true);
});

test("isEmail: rejects non-strings and out-of-range lengths", () => {
  assert.equal(isEmail(null), false);
  assert.equal(isEmail(42), false);
  assert.equal(isEmail("a@b.c"), false);
  assert.equal(isEmail(`${"a".repeat(250)}@example.com`), false);
});

// ---------------------------------------------------------------------------
// control-char stripping
// ---------------------------------------------------------------------------
test("stripControl: removes C0 control chars but keeps tab and newline", () => {
  assert.equal(stripControl("a\u0000b\u0007c\u001Fd"), "abcd");
  assert.equal(stripControl("a\tb\nc"), "a\tb\nc");
  assert.equal(stripControl("keep\ttab and\nnewline"), "keep\ttab and\nnewline");
  assert.equal(stripControl("del\u007Fchar"), "delchar");
});

test("stripControl: normalises CRLF/CR to LF", () => {
  assert.equal(stripControl("a\r\nb"), "a\nb");
  assert.equal(stripControl("a\rb"), "a\nb");
});

test("stripControl: non-strings become empty string", () => {
  assert.equal(stripControl(null), "");
  assert.equal(stripControl(123), "");
  assert.equal(stripControl(undefined), "");
});

test("clean: trims, strips control chars and caps length", () => {
  assert.equal(clean("  hello  "), "hello");
  assert.equal(clean("hello", 3), "hel");
  assert.equal(clean("a\u0000b", 10), "ab");
  assert.equal(clean(null), "");
  assert.equal(clean(123), "");
  assert.equal(clean("abcdef", 0), "");
  assert.equal(clean("trim-before-cap   ", 4), "trim");
});

// ---------------------------------------------------------------------------
// URL / link-flood detection
// ---------------------------------------------------------------------------
test("countUrls: counts http(s) and www links", () => {
  assert.equal(countUrls("no links here"), 0);
  assert.equal(countUrls("see https://a.com"), 1);
  assert.equal(countUrls("https://a.com and www.b.com"), 2);
  assert.equal(countUrls("http://a.com https://b.com http://c.com"), 3);
  assert.equal(countUrls(""), 0);
  assert.equal(countUrls(null), 0);
  assert.equal(countUrls(123), 0);
});

test("linkFloodFields: flags fields exceeding the link cap", () => {
  const spam = Array.from({ length: MAX_LINKS_PER_FIELD + 1 }, (_, i) => `https://spam${i}.example`).join(" ");
  const ok = Array.from({ length: MAX_LINKS_PER_FIELD }, (_, i) => `https://ok${i}.example`).join(" ");

  const flagged = linkFloodFields({ title: "fine", description: spam, notes: ok });
  assert.deepEqual(flagged, ["description"]);
});

test("linkFloodFields: honours a custom max and tolerates bad input", () => {
  assert.deepEqual(linkFloodFields({ a: "https://x.com https://y.com" }, 1), ["a"]);
  assert.deepEqual(linkFloodFields({ a: "https://x.com https://y.com" }, 2), []);
  assert.deepEqual(linkFloodFields(null), []);
  assert.deepEqual(linkFloodFields("not-an-object"), []);
});

// ---------------------------------------------------------------------------
// asInt coercion
// ---------------------------------------------------------------------------
test("asInt: coerces and bounds integers, falling back when out of range", () => {
  assert.equal(asInt("42"), 42);
  assert.equal(asInt(42.9), 42);
  assert.equal(asInt("42abc"), 42);
  assert.equal(asInt("", { fallback: 7 }), 7);
  assert.equal(asInt(null, { fallback: 7 }), 7);
  assert.equal(asInt(undefined, { fallback: 7 }), 7);
  assert.equal(asInt("nope", { fallback: 7 }), 7);
  assert.equal(asInt(5, { min: 10, fallback: -1 }), -1);
  assert.equal(asInt(50, { max: 10, fallback: -1 }), -1);
  assert.equal(asInt(5, { min: 1, max: 10 }), 5);
});

// ---------------------------------------------------------------------------
// honeypot
// ---------------------------------------------------------------------------
test("isHoneypot: trips on the hidden company/website fields", () => {
  assert.equal(isHoneypot({ company: "ACME" }), true); // non-empty -> true
  assert.equal(isHoneypot({ website: "http://bot" }), true);
  assert.equal(isHoneypot({ company: "   " }), false, "whitespace is not a filled honeypot");
  assert.equal(isHoneypot({ company: "" }), false);
  assert.equal(isHoneypot({ title: "real submission" }), false);
});

// ---------------------------------------------------------------------------
// readBody
// ---------------------------------------------------------------------------
test("readBody: parses a JSON object body", async () => {
  const req = new Request("https://buildforgood.world/api/problems", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Hi", n: 3 }),
  });
  const result = await readBody(req);
  assert.equal(result.ok, true);
  assert.deepEqual(result.body, { title: "Hi", n: 3 });
});

test("readBody: parses an x-www-form-urlencoded body", async () => {
  const req = new Request("https://buildforgood.world/api/problems", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "title=Hello&tag=a+b",
  });
  const result = await readBody(req);
  assert.equal(result.ok, true);
  assert.deepEqual(result.body, { title: "Hello", tag: "a b" });
});

test("readBody: rejects non-object JSON", async () => {
  const req = new Request("https://buildforgood.world/api/problems", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "[1,2,3]",
  });
  const result = await readBody(req);
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(result.error, "invalid_json");
});

test("readBody: rejects malformed JSON", async () => {
  const req = new Request("https://buildforgood.world/api/problems", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not json",
  });
  const result = await readBody(req);
  assert.equal(result.ok, false);
  assert.equal(result.error, "invalid_json");
});

test("readBody: 413 when Content-Length exceeds the cap", async () => {
  const req = new Request("https://buildforgood.world/api/problems", {
    method: "POST",
    headers: { "content-type": "application/json", "content-length": String(MAX_BODY_BYTES + 1) },
    body: "{}",
  });
  const result = await readBody(req);
  assert.equal(result.ok, false);
  assert.equal(result.status, 413);
  assert.equal(result.error, "payload_too_large");
});

test("readBody: empty body yields an empty object", async () => {
  const req = new Request("https://buildforgood.world/api/problems", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "",
  });
  const result = await readBody(req);
  assert.equal(result.ok, true);
  assert.deepEqual(result.body, {});
});

test("MAX_BODY_BYTES is the documented 100 KiB cap", () => {
  assert.equal(MAX_BODY_BYTES, 100 * 1024);
  assert.equal(MAX_LINKS_PER_FIELD, 5);
});
