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
  MAX_BUILDING,
  MAX_DISCIPLINES,
  MAX_EMAIL,
  MAX_LINKS,
  MAX_LOCATION,
  MAX_NAME,
  MAX_REFERRAL,
  MAX_STRUGGLING,
  MAX_WHY_BGET,
  MIN_APPLY_NAME,
  MIN_BUILDING,
} from "@/components/site/form-validation";

const initial = {
  name: "",
  email: "",
  location: "",
  disciplines: "",
  links: "",
  building: "",
  struggling: "",
  why_bget: "",
  referral: "",
  website: "", // honeypot
};

type Values = typeof initial;

/** Mirrors the limits in `handleApply` (worker/routes/public.js). */
function validate(values: Values) {
  const errors: Record<string, string> = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const building = values.building.trim();

  if (!name) errors.name = "Please tell us your name.";
  else if (name.length < MIN_APPLY_NAME) errors.name = "That looks a little short — please add your name.";
  else if (name.length > MAX_NAME) errors.name = `Please keep this under ${MAX_NAME} characters.`;

  if (!email) errors.email = "Please add an email so we can reply.";
  else if (!isEmail(email)) errors.email = "That doesn't look like a valid email address.";

  if (!building) errors.building = "Please tell us one thing you have made.";
  else if (building.length < MIN_BUILDING)
    errors.building = "A few more words, please — around a sentence is plenty.";
  else if (building.length > MAX_BUILDING)
    errors.building = `Please keep this under ${MAX_BUILDING} characters.`;

  return errors;
}

const success = (data: Record<string, unknown>, values: Values) => {
  void data;
  const email = values.email.trim();
  return {
    message: "Application received — thank you.",
    detail:
      "A person, not a filter, will read this. You don't need a résumé; you've already given us the honest part.",
    next: [
      "A human reads every application — usually within 72 hours.",
      email ? `We'll reply by email at ${email}.` : "We'll reply by email.",
      "If it looks like a fit, we'll invite you to a short conversation — you're deciding whether we're worth your time too.",
    ],
  };
};

export function ApplyForm() {
  const { values, errors, status, pending, formRef, set, submit, reset } = useFormSubmit({
    endpoint: "/api/apply",
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
              <Field label="Name" required id="apply-name" error={errors.name}>
                <TextInput
                  name="name"
                  value={values.name}
                  onChange={set("name")}
                  maxLength={MAX_NAME}
                  autoComplete="name"
                />
              </Field>
              <Field label="Email" required id="apply-email" error={errors.email}>
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

          <Reveal y={16} delay={60}>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field label="Where you are" id="apply-location" error={errors.location}>
                <TextInput
                  name="location"
                  value={values.location}
                  onChange={set("location")}
                  maxLength={MAX_LOCATION}
                  placeholder="City, country"
                  autoComplete="address-level2"
                />
              </Field>
              <Field label="Disciplines" id="apply-disciplines" error={errors.disciplines}>
                <TextInput
                  name="disciplines"
                  value={values.disciplines}
                  onChange={set("disciplines")}
                  maxLength={MAX_DISCIPLINES}
                  placeholder="e.g. medicine, ML, design"
                />
              </Field>
            </div>
          </Reveal>

          <Reveal y={16} delay={120}>
            <Field
              label="One thing you have made"
              hint="A link, a repo, a lab result, a business, a drawing — small and honest beats impressive-sounding."
              required
              id="apply-building"
              error={errors.building}
            >
              <TextArea
                name="building"
                value={values.building}
                onChange={set("building")}
                maxLength={MAX_BUILDING}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={180}>
            <Field
              label="Something you're genuinely struggling with"
              id="apply-struggling"
              error={errors.struggling}
            >
              <TextArea
                name="struggling"
                value={values.struggling}
                onChange={set("struggling")}
                maxLength={MAX_STRUGGLING}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={240}>
            <Field
              label="Why Build For Good, and what you want to become"
              id="apply-why-bget"
              error={errors.why_bget}
            >
              <TextArea
                name="why_bget"
                value={values.why_bget}
                onChange={set("why_bget")}
                maxLength={MAX_WHY_BGET}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={300}>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field
                label="Links"
                hint="GitHub, portfolio, writing — optional."
                id="apply-links"
                error={errors.links}
              >
                <TextInput
                  name="links"
                  value={values.links}
                  onChange={set("links")}
                  maxLength={MAX_LINKS}
                  inputMode="url"
                  autoComplete="url"
                />
              </Field>
              <Field label="Referred by" hint="A member's name, if any." id="apply-referral" error={errors.referral}>
                <TextInput
                  name="referral"
                  value={values.referral}
                  onChange={set("referral")}
                  maxLength={MAX_REFERRAL}
                />
              </Field>
            </div>
          </Reveal>

          <Honeypot name="website" value={values.website} onChange={set("website")} />

          <Reveal y={16} delay={360}>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <SubmitButton loading={pending} loadingLabel="Sending application…">
                Apply to join
              </SubmitButton>
              <FormStatus status={status} />
            </div>
          </Reveal>

          <Reveal y={16} delay={420}>
            <ReassuranceNote>
              Applications are read only by the members who review them, and used only to
              decide membership — never sold, shared, or published. It&apos;s the same{" "}
              <em className="not-italic text-foreground/80">privacy and trust</em> standard we
              hold each other to. Ask us to delete yours at any time.
            </ReassuranceNote>
          </Reveal>
        </>
      )}
    </form>
  );
}
