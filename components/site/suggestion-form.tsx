"use client";

import { Reveal } from "@/components/motion/reveal";
import {
  Field,
  FormStatus,
  Honeypot,
  ReassuranceNote,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/site/form-ui";
import { useFormSubmit } from "@/components/site/use-form-submit";
import {
  isEmail,
  MAX_EMAIL,
  MAX_NAME,
  MAX_SUGGESTION_BODY,
  MAX_TOPIC,
  MIN_SUGGESTION_BODY,
  MIN_TOPIC,
} from "@/components/site/form-validation";

const initial = {
  topic: "",
  body: "",
  name: "",
  email: "",
  company: "", // honeypot
};

type Values = typeof initial;

/** Mirrors the limits in `handleSuggestions` (worker/routes/public.js). */
function validate(values: Values) {
  const errors: Record<string, string> = {};
  const topic = values.topic.trim();
  const body = values.body.trim();
  const email = values.email.trim();

  if (!topic) errors.topic = "Give your idea a short title.";
  else if (topic.length < MIN_TOPIC) errors.topic = "A few more characters, please.";
  else if (topic.length > MAX_TOPIC) errors.topic = `Please keep this under ${MAX_TOPIC} characters.`;

  if (!body) errors.body = "Tell us the idea itself.";
  else if (body.length < MIN_SUGGESTION_BODY) errors.body = "A little more, please — even one sentence helps.";
  else if (body.length > MAX_SUGGESTION_BODY)
    errors.body = `Please keep this under ${MAX_SUGGESTION_BODY} characters.`;

  if (email && !isEmail(email)) errors.email = "That doesn't look like a valid email address.";

  return errors;
}

const success = (data: Record<string, unknown>, values: Values) => {
  void data;
  const email = values.email.trim();
  return {
    message: "Idea received — thank you.",
    detail: "Rough ideas are easier to shape than finished ones. This is the right time to send it.",
    next: [
      "A human reads every suggestion — not a queue, not a filter.",
      email
        ? `If it fits what we're building, we'll come back to you at ${email}.`
        : "If you'd like an answer, add an email next time — this one came through anonymously.",
    ],
  };
};

export function SuggestionForm() {
  const { values, errors, status, pending, formRef, set, submit, reset } = useFormSubmit({
    endpoint: "/api/suggestions",
    initial,
    validate,
    success,
  });

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid max-w-2xl gap-8">
      {status.type === "ok" ? (
        <FormStatus status={status} onReset={reset} />
      ) : (
        <>
          <Reveal y={16}>
            <Field label="Topic" hint="The idea in a few words." required id="suggestion-topic" error={errors.topic}>
              <TextInput
                name="topic"
                value={values.topic}
                onChange={set("topic")}
                maxLength={MAX_TOPIC}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={80}>
            <Field
              label="Your idea"
              hint="A new activity, a partner, a way to run the community, something we're missing. Rough is fine — we're after the thought, not a proposal."
              required
              id="suggestion-body"
              error={errors.body}
            >
              <TextArea
                name="body"
                value={values.body}
                onChange={set("body")}
                maxLength={MAX_SUGGESTION_BODY}
                className="min-h-[160px]"
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={160}>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field label="Name" hint="Optional." id="suggestion-name" error={errors.name}>
                <TextInput
                  name="name"
                  value={values.name}
                  onChange={set("name")}
                  maxLength={MAX_NAME}
                  autoComplete="name"
                />
              </Field>
              <Field
                label="Email"
                hint="Optional — only if you'd like a reply."
                id="suggestion-email"
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
            </div>
          </Reveal>

          <Honeypot name="company" value={values.company} onChange={set("company")} />

          <Reveal y={16} delay={220}>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <SubmitButton loading={pending} loadingLabel="Sending suggestion…">
                Send suggestion
              </SubmitButton>
              <FormStatus status={status} />
            </div>
          </Reveal>

          <Reveal y={16} delay={280}>
            <ReassuranceNote>
              Suggestions are read by a human, not a queue. We&apos;d rather hear a rough idea
              early than a polished one once it&apos;s too late to shape it.
            </ReassuranceNote>
          </Reveal>
        </>
      )}
    </form>
  );
}
