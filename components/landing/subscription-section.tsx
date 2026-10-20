"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useFormSubmit } from "@/components/site/use-form-submit";
import { Field, FormStatus, SubmitButton, TextInput } from "@/components/site/form-ui";
import { isEmail } from "@/components/site/form-validation";

/** Constants for subscription form validation */
const MAX_NAME = 120;

/**
 * Validation rules for the subscription form.
 * Mirrors email validation in `worker/lib/validate.js` (isEmail).
 */
function validateSubscription(values: {
  email: string;
  name?: string;
}) {
  const errors: Record<string, string> = {};

  const email = values.email.trim().toLowerCase();

  if (!email || !isEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (values.name && values.name.trim().length > MAX_NAME) {
    errors.name = `Please keep your name under ${MAX_NAME} characters.`;
  }

  return errors;
}

/** Success message displayed after subscription */
const subscriptionSuccess = {
  message: "Welcome to Build For Good!",
  detail: "You'll now receive weekly updates about our projects, problem solutions, and impact opportunities.",
  next: [
    "✅ Weekly ritual updates – key milestones and what we're building next",
    "🔍 Problem updates – new challenges and solutions in our commons",
    "🚀 Project spotlights – deep dives into impactful work",
  ],
};

export function SubscriptionSection() {
  const { values, errors, status, pending, formRef, set, submit, reset } = useFormSubmit({
    endpoint: "/api/subscribe",
    initial: { email: "", name: "" },
    validate: validateSubscription,
    success: () => subscriptionSuccess,
  });

  // Local state for the counter
  const [subscribersCount, setSubscribersCount] = useState<number | null>(null);

  // Fetch the public aggregate count on mount. `/api/subscribers` is
  // admin-only (it returns real email addresses and 401s for visitors), so the
  // section uses `/api/subscribers/count`, which exposes a single safe number.
  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const res = await fetch("/api/subscribers/count");
        if (!res.ok) return;
        const data = (await res.json()) as { ok?: boolean; count?: unknown };
        if (!cancelled && data.ok && typeof data.count === "number") {
          setSubscribersCount(data.count);
        }
      } catch {
        // Silently fail – the counter is not critical to subscribing.
      }
    }

    void fetchCount();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-card">
      {/* Soft accent glows for depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#eca8d6]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#a78bfa]/10 blur-3xl"
      />

      <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14">
        {/* Left: pitch + benefits */}
        <div>
          <p className="text-sm font-mono uppercase tracking-[0.15em] text-[#eca8d6]">
            Stay in the loop
          </p>
          <h2 className="mt-3 text-3xl lg:text-4xl font-display tracking-tight text-balance">
            Join our community
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Get weekly updates from Build For Good about projects, problems, and impact
            opportunities.
          </p>

          <ul className="mt-8 space-y-3">
            <li className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 text-[#eca8d6]">✅</span>
              <span className="text-sm text-muted-foreground">
                Weekly rituals — key milestones and what we are building next
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 text-[#eca8d6]">🔍</span>
              <span className="text-sm text-muted-foreground">
                Problem updates — new challenges and solutions in our commons
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 text-[#eca8d6]">🚀</span>
              <span className="text-sm text-muted-foreground">
                Project spotlights — deep dives into impactful work
              </span>
            </li>
          </ul>
        </div>

        {/* Right: form + live subscriber count */}
        <div className="lg:pt-2">
          {status.type === "ok" ? (
            <div className="mb-4">
              <FormStatus status={status} onReset={reset} />
            </div>
          ) : (
            <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
              <Field label="Email address" required error={errors.email} id="subscribe-email">
                <TextInput
                  name="email"
                  placeholder="you@example.com"
                  onChange={set("email")}
                  value={values.email}
                  autoComplete="email"
                  disabled={pending}
                />
              </Field>

              <Field label="Name (optional)" error={errors.name} id="subscribe-name">
                <TextInput
                  name="name"
                  placeholder="Your name"
                  onChange={set("name")}
                  value={values.name}
                  autoComplete="name"
                  disabled={pending}
                />
              </Field>

              <SubmitButton loading={pending}>
                {pending ? "Subscribing…" : "Subscribe"}
              </SubmitButton>
            </form>
          )}

          <p className="mt-2 text-sm text-muted-foreground">
            No spam — just weekly updates. Unsubscribe any time.
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            This newsletter is separate from membership.{" "}
            <a
              href="/membership"
              className="text-foreground/80 underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Apply to join
            </a>{" "}
            to take part in the community.
          </p>

          <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
            {subscribersCount === null
              ? "Join the people already receiving our weekly updates."
              : `${subscribersCount.toLocaleString()} active subscriber${
                  subscribersCount === 1 ? "" : "s"
                } already receiving our updates.`}
          </p>
        </div>
      </div>
    </section>
  );
}