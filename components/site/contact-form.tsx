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
  MAX_MESSAGE,
  MAX_NAME,
  MAX_SUBJECT,
  MIN_CONTACT_MESSAGE,
  MIN_CONTACT_NAME,
} from "@/components/site/form-validation";

const initial = {
  name: "",
  email: "",
  subject: "",
  message: "",
  company: "", // honeypot
};

type Values = typeof initial;

/** Mirrors the limits in `handleContact` (worker/routes/public.js). */
function validate(values: Values) {
  const errors: Record<string, string> = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();

  if (!name) errors.name = "Please tell us your name.";
  else if (name.length < MIN_CONTACT_NAME) errors.name = "That looks a little short — please add your name.";
  else if (name.length > MAX_NAME) errors.name = `Please keep this under ${MAX_NAME} characters.`;

  if (!email) errors.email = "Please add an email so we can reply.";
  else if (!isEmail(email)) errors.email = "That doesn't look like a valid email address.";

  if (!message) errors.message = "Please write a message.";
  else if (message.length < MIN_CONTACT_MESSAGE)
    errors.message = "A little more, please — a sentence is enough.";
  else if (message.length > MAX_MESSAGE)
    errors.message = `Please keep this under ${MAX_MESSAGE} characters.`;

  return errors;
}

const success = (data: Record<string, unknown>, values: Values) => {
  void data;
  const email = values.email.trim();
  return {
    message: "Message received — thank you.",
    detail: "A person reads it. Never a form letter.",
    next: [
      "A human will read it and reply — usually within 72 hours.",
      email ? `We'll reply to ${email}.` : "We couldn't find an email, so we can't reply.",
      "If it belongs with someone specific, we'll say so when we reply.",
    ],
  };
};

export function ContactForm() {
  const { values, errors, status, pending, formRef, set, submit, reset } = useFormSubmit({
    endpoint: "/api/contact",
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
            <div className="grid gap-8 sm:grid-cols-2">
              <Field label="Name" required id="contact-name" error={errors.name}>
                <TextInput
                  name="name"
                  value={values.name}
                  onChange={set("name")}
                  maxLength={MAX_NAME}
                  autoComplete="name"
                />
              </Field>
              <Field label="Email" required id="contact-email" error={errors.email}>
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

          <Reveal y={16} delay={80}>
            <Field
              label="Subject"
              hint="Optional — a few words on what this is about."
              id="contact-subject"
              error={errors.subject}
            >
              <TextInput
                name="subject"
                value={values.subject}
                onChange={set("subject")}
                maxLength={MAX_SUBJECT}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={160}>
            <Field label="Message" required id="contact-message" error={errors.message}>
              <TextArea
                name="message"
                value={values.message}
                onChange={set("message")}
                maxLength={MAX_MESSAGE}
              />
            </Field>
          </Reveal>

          <Honeypot name="company" value={values.company} onChange={set("company")} />

          <Reveal y={16} delay={220}>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <SubmitButton loading={pending} loadingLabel="Sending message…">
                Send message
              </SubmitButton>
              <FormStatus status={status} />
            </div>
          </Reveal>

          <Reveal y={16} delay={280}>
            <ReassuranceNote>
              We read every message ourselves and never pass your details to anyone else. If it
              belongs with someone specific, we&apos;ll say so when we reply.
            </ReassuranceNote>
          </Reveal>
        </>
      )}
    </form>
  );
}
