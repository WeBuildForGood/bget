"use client";

import { Reveal } from "@/components/motion/reveal";
import {
  Field,
  FormStatus,
  Honeypot,
  RadioGroupField,
  ReassuranceNote,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/site/form-ui";
import { useFormSubmit } from "@/components/site/use-form-submit";
import {
  isEmail,
  MAX_EMAIL,
  MAX_LOCATION,
  MAX_NAME,
  MAX_PROBLEM_LONG,
  MAX_TITLE,
  MAX_DESCRIPTION,
  MIN_PROBLEM_DESCRIPTION,
  MIN_PROBLEM_TITLE,
} from "@/components/site/form-validation";

const initial = {
  title: "",
  description: "",
  success_looks_like: "",
  affected: "",
  tried: "",
  why_bget: "",
  contribution: "",
  submitter_name: "",
  email: "",
  location: "",
  visibility: "bget",
  website: "", // honeypot
};

type Values = typeof initial;

const VISIBILITY_OPTIONS = [
  {
    value: "public",
    label: "Public",
    description: "Build For Good may publish it in the Problem Commons.",
  },
  {
    value: "bget",
    label: "Build For Good review only",
    description: "Reviewers see it; it stays out of the public list.",
  },
  {
    value: "private",
    label: "Private",
    description: "My eyes only — nothing is published or quoted.",
  },
];

/** Mirrors the limits in `handleProblems` (worker/routes/public.js). */
function validate(values: Values) {
  const errors: Record<string, string> = {};
  const title = values.title.trim();
  const description = values.description.trim();
  const email = values.email.trim();

  if (!title) errors.title = "Give the problem a one-line title.";
  else if (title.length < MIN_PROBLEM_TITLE)
    errors.title = "A little more, please — a few words is enough.";
  else if (title.length > MAX_TITLE) errors.title = `Please keep this under ${MAX_TITLE} characters.`;

  if (!description) errors.description = "Describe what is actually happening.";
  else if (description.length < MIN_PROBLEM_DESCRIPTION)
    errors.description = "Please add a bit more detail — a sentence or two about who lives with it.";
  else if (description.length > MAX_DESCRIPTION)
    errors.description = `Please keep this under ${MAX_DESCRIPTION} characters.`;

  if (email && !isEmail(email)) errors.email = "That doesn't look like a valid email address.";

  return errors;
}

const success = (data: Record<string, unknown>, values: Values) => {
  void data;
  const publicVisit = values.visibility === "public";
  const email = values.email.trim();
  return {
    message: "Problem received — thank you.",
    detail: "No upvotes, no queue you can't see into. A person will read this next.",
    next: [
      "A human answers within 72 hours — framing it, parking it, or declining it with a reason.",
      publicVisit
        ? "You chose Public, so it may be published in the Problem Commons (without your email)."
        : "Your visibility setting keeps it out of the public Problem Commons.",
      email
        ? `We'll reply by email at ${email}.`
        : "You didn't leave an email, so we can't reply this time.",
    ],
  };
};

export function ProblemForm() {
  const { values, errors, status, pending, formRef, set, submit, reset } = useFormSubmit({
    endpoint: "/api/problems",
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
            <Field label="The problem, in one line" required id="problem-title" error={errors.title}>
              <TextInput
                name="title"
                value={values.title}
                onChange={set("title")}
                maxLength={MAX_TITLE}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={50}>
            <Field
              label="What is actually happening?"
              hint="Describe it plainly. Who lives with it? What does it cost them?"
              required
              id="problem-description"
              error={errors.description}
            >
              <TextArea
                name="description"
                value={values.description}
                onChange={set("description")}
                maxLength={MAX_DESCRIPTION}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={100}>
            <Field
              label="What would success look like?"
              hint='Make it concrete — "fewer families boiling unsafe water", not "fix the water".'
              id="problem-success"
              error={errors.success_looks_like}
            >
              <TextArea
                name="success_looks_like"
                value={values.success_looks_like}
                onChange={set("success_looks_like")}
                maxLength={MAX_PROBLEM_LONG}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={150}>
            <Field label="Who is affected?" id="problem-affected" error={errors.affected}>
              <TextArea
                name="affected"
                value={values.affected}
                onChange={set("affected")}
                maxLength={MAX_PROBLEM_LONG}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={200}>
            <Field
              label="What has already been tried, and why did it fall short?"
              id="problem-tried"
              error={errors.tried}
            >
              <TextArea
                name="tried"
                value={values.tried}
                onChange={set("tried")}
                maxLength={MAX_PROBLEM_LONG}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={250}>
            <Field
              label="Why might Build For Good be useful here?"
              hint="The interdisciplinary angle, a neglected corner, a research gap."
              id="problem-why-bget"
              error={errors.why_bget}
            >
              <TextArea
                name="why_bget"
                value={values.why_bget}
                onChange={set("why_bget")}
                maxLength={MAX_PROBLEM_LONG}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={300}>
            <Field
              label="What can you contribute?"
              hint="Local knowledge counts as expertise. You may be the most valuable person on the team."
              id="problem-contribution"
              error={errors.contribution}
            >
              <TextArea
                name="contribution"
                value={values.contribution}
                onChange={set("contribution")}
                maxLength={MAX_PROBLEM_LONG}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={350}>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field label="Your name" id="problem-submitter-name" error={errors.submitter_name}>
                <TextInput
                  name="submitter_name"
                  value={values.submitter_name}
                  onChange={set("submitter_name")}
                  maxLength={MAX_NAME}
                  autoComplete="name"
                />
              </Field>
              <Field
                label="Email"
                hint="Optional — add one if you'd like a reply."
                id="problem-email"
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

          <Reveal y={16} delay={400}>
            <Field label="Where is the problem?" id="problem-location" error={errors.location}>
              <TextInput
                name="location"
                value={values.location}
                onChange={set("location")}
                maxLength={MAX_LOCATION}
                placeholder="Place, region, country"
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={430}>
            <RadioGroupField
              legend="Who should be able to see this?"
              name="visibility"
              value={values.visibility}
              onChange={set("visibility")}
              options={VISIBILITY_OPTIONS}
            />
          </Reveal>

          <Honeypot name="website" value={values.website} onChange={set("website")} />

          <Reveal y={16} delay={450}>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <SubmitButton loading={pending} loadingLabel="Sending problem…">
                Submit the problem
              </SubmitButton>
              <FormStatus status={status} />
            </div>
          </Reveal>

          <Reveal y={16} delay={500}>
            <ReassuranceNote>
              Your problem is read by the people reviewing submissions. Public problems may
              appear in the Problem Commons; &ldquo;review only&rdquo; and &ldquo;private&rdquo;
              never do, and nothing private is published or quoted. An unanswered submission is
              a broken promise — every one gets a human answer within 72 hours.
            </ReassuranceNote>
          </Reveal>
        </>
      )}
    </form>
  );
}
