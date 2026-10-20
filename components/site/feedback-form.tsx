"use client";

import { Reveal } from "@/components/motion/reveal";
import {
  Field,
  FormStatus,
  Honeypot,
  ReassuranceNote,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/site/form-ui";
import { useFormSubmit } from "@/components/site/use-form-submit";
import {
  isEmail,
  MAX_EMAIL,
  MAX_FEEDBACK_BODY,
  MAX_PAGE,
  MIN_FEEDBACK_BODY,
} from "@/components/site/form-validation";

const initial = {
  kind: "idea",
  page: "",
  body: "",
  email: "",
  rating: "",
  company: "", // honeypot
};

type Values = typeof initial;

const KINDS = ["idea", "bug", "praise", "other"] as const;

/** Mirrors the limits in `handleFeedback` (worker/routes/public.js). */
function validate(values: Values) {
  const errors: Record<string, string> = {};
  const body = values.body.trim();
  const email = values.email.trim();

  if (!body) errors.body = "Please tell us what happened.";
  else if (body.length < MIN_FEEDBACK_BODY) errors.body = "A little more, please — even one line helps.";
  else if (body.length > MAX_FEEDBACK_BODY)
    errors.body = `Please keep this under ${MAX_FEEDBACK_BODY} characters.`;

  if (email && !isEmail(email)) errors.email = "That doesn't look like a valid email address.";

  return errors;
}

/** The API expects a normalised `kind` and a numeric `rating` (or none). */
function toPayload(values: Values): Record<string, unknown> {
  const kind = (KINDS as readonly string[]).includes(values.kind) ? values.kind : "idea";
  const payload: Record<string, unknown> = {
    kind,
    page: values.page,
    body: values.body,
    email: values.email,
    company: values.company,
  };
  if (values.rating) payload.rating = Number(values.rating);
  return payload;
}

const success = (data: Record<string, unknown>, values: Values) => {
  void data;
  const email = values.email.trim();
  return {
    message: "Feedback received — thank you.",
    detail: "Feedback like this is how the site actually gets better.",
    next: [
      "A human reads every report, including the blunt ones.",
      email
        ? `If there's anything to follow up, we'll write to ${email}.`
        : "You left no email, so this came through anonymously — still useful.",
      "We won't publish your feedback without asking.",
    ],
  };
};

export function FeedbackForm() {
  const { values, errors, status, pending, formRef, set, submit, reset } = useFormSubmit({
    endpoint: "/api/feedback",
    initial,
    validate,
    toPayload,
    success,
  });

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid max-w-2xl gap-8">
      {status.type === "ok" ? (
        <FormStatus status={status} onReset={reset} />
      ) : (
        <>
          <Reveal y={16}>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field label="What kind of feedback is this?" required id="feedback-kind" error={errors.kind}>
                <Select name="kind" value={values.kind} onChange={set("kind")}>
                  <option value="idea">An idea</option>
                  <option value="bug">Something is broken</option>
                  <option value="praise">Something worked well</option>
                  <option value="other">Something else</option>
                </Select>
              </Field>
              <Field label="Page or area" hint="Optional — where did you see it?" id="feedback-page" error={errors.page}>
                <TextInput
                  name="page"
                  value={values.page}
                  onChange={set("page")}
                  maxLength={MAX_PAGE}
                  placeholder="e.g. /membership, the footer"
                />
              </Field>
            </div>
          </Reveal>

          <Reveal y={16} delay={80}>
            <Field
              label="Your feedback"
              hint="What did you see, and what did you expect instead? Plain and specific beats polished."
              required
              id="feedback-body"
              error={errors.body}
            >
              <TextArea
                name="body"
                value={values.body}
                onChange={set("body")}
                maxLength={MAX_FEEDBACK_BODY}
                className="min-h-[160px]"
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={160}>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field
                label="Email"
                hint="Optional — only if you'd like a reply."
                id="feedback-email"
                error={errors.email}
              >
                <TextInput
                  type="email"
                  inputMode="email"
                  name="email"
                  value={values.email}
                  onChange={set("email")}
                  maxLength={MAX_EMAIL}
                  autoComplete="email"
                />
              </Field>
              <Field
                label="How is it going overall?"
                hint="Optional — 1 is rough, 5 is great."
                id="feedback-rating"
                error={errors.rating}
              >
                <Select name="rating" value={values.rating} onChange={set("rating")}>
                  <option value="">No rating</option>
                  <option value="1">1 — rough</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5 — great</option>
                </Select>
              </Field>
            </div>
          </Reveal>

          <Honeypot name="company" value={values.company} onChange={set("company")} />

          <Reveal y={16} delay={220}>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <SubmitButton loading={pending} loadingLabel="Sending feedback…">
                Send feedback
              </SubmitButton>
              <FormStatus status={status} />
            </div>
          </Reveal>

          <Reveal y={16} delay={280}>
            <ReassuranceNote>
              Bug reports and sharp criticism are welcome — they&apos;re how the site earns the
              trust of the people using it. We won&apos;t publish your feedback without asking.
            </ReassuranceNote>
          </Reveal>
        </>
      )}
    </form>
  );
}
