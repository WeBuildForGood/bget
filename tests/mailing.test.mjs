import test from "node:test";
import assert from "node:assert/strict";

import { buildResendPayload } from "../worker/lib/mailing.js";

test("buildResendPayload maps html_body to Resend's html field", () => {
  const payload = buildResendPayload(
    { NOTIFY_FROM: "Build For Good <notify@buildforgood.world>" },
    { to: "person@example.com", subject: "Hello", html_body: "<p>Hi</p>" },
  );

  assert.deepEqual(payload, {
    from: "Build For Good <notify@buildforgood.world>",
    to: ["person@example.com"],
    subject: "Hello",
    html: "<p>Hi</p>",
  });
  assert.equal("html_body" in payload, false);
});

test("buildResendPayload falls back to the default from address", () => {
  const payload = buildResendPayload({}, { to: "a@b.co", subject: "Hi" });
  assert.equal(payload.from, "Build For Good <notify@buildforgood.world>");
});

test("buildResendPayload supports text-only replies", () => {
  const payload = buildResendPayload({}, {
    to: "person@example.com",
    subject: "Re: hello",
    text_body: "Thanks for writing in.",
  });

  assert.equal(payload.text, "Thanks for writing in.");
  assert.equal(payload.html, undefined);
});

test("buildResendPayload never emits an empty message body", () => {
  const payload = buildResendPayload({}, { to: "a@b.co", subject: "Hi" });
  assert.equal(payload.text, "");
});
