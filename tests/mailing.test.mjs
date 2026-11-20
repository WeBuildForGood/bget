import test from "node:test";
import assert from "node:assert/strict";

import { buildResendPayload, logSend } from "../worker/lib/mailing.js";

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

test("logSend calls .bind(...args).run() with correct parameters", async () => {
  let boundArgs = null;
  let runCalled = false;

  const mockDb = {
    prepare(sql) {
      assert.ok(sql.includes("INSERT INTO mail_sends"));
      return {
        bind(...args) {
          boundArgs = args;
          return {
            async run() {
              runCalled = true;
              return { success: true };
            },
          };
        },
      };
    },
  };

  const ok = await logSend({ DB: mockDb }, 42, "Monthly Update", "<p>Update</p>", "2026-11-20T00:00:00Z");
  assert.equal(ok, true);
  assert.equal(runCalled, true);
  assert.deepEqual(boundArgs, [42, "Monthly Update", "<p>Update</p>", "2026-11-20T00:00:00Z"]);
});

test("logSend returns false safely when DB binding is absent", async () => {
  const ok = await logSend({}, 42, "Test", "body", "now");
  assert.equal(ok, false);
});
