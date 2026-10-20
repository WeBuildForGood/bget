"use client";

import { Reveal } from "@/components/motion/reveal";
import {
  Field,
  FormStatus,
  Honeypot,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/site/form-ui";
import { useFormSubmit } from "@/components/site/use-form-submit";
import {
  isEmail,
  MAX_DISCIPLINES,
  MAX_EMAIL,
  MAX_LOCATION,
} from "@/components/site/form-validation";

const STAGES = ["idea", "prototype", "pilot", "live", "scaled"] as const;

const initial = {
  title: "",
  one_liner: "",
  description: "",
  lead_name: "",
  lead_email: "",
  disciplines: "",
  stage: "",
  url: "",
  repo: "",
  demo: "",
  cover_image: "",
  location: "",
  team: "",
  tags: "",
  company: "", // honeypot — real people never see or fill this
};

type Values = typeof initial;

/*
 * Length limits mirrored from `createProject` (worker/routes/public.js), which
 * rejects required fields that are too short with `{ error: "invalid", fields }`
 * and caps every value with `clean(value, max)`. The shared constants cover the
 * fields the server validates the same way elsewhere; the rest live here so the
 * browser rejects exactly what the API would.
 */
const MIN_TITLE = 3;
const MAX_TITLE = 200;
const MIN_ONE_LINER = 10;
const MAX_ONE_LINER = 300;
const MIN_DESCRIPTION = 20;
const MAX_DESCRIPTION = 10000;
const MIN_LEAD_NAME = 2;
const MAX_LEAD_NAME = 120;
const MAX_URL = 500;
const MAX_TEAM = 1000;
const MAX_TAGS = 500;

/** Mirrors the limits in `createProject` (worker/routes/public.js). */
function validate(values: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = values.title.trim();
  const oneLiner = values.one_liner.trim();
  const description = values.description.trim();
  const leadName = values.lead_name.trim();
  const leadEmail = values.lead_email.trim();

  if (!title) errors.title = "Give the project a title.";
  else if (title.length < MIN_TITLE) errors.title = "A little more, please — a few words is enough.";
  else if (title.length > MAX_TITLE) errors.title = `Please keep this under ${MAX_TITLE} characters.`;

  if (!oneLiner) errors.one_liner = "Add a one-line summary.";
  else if (oneLiner.length < MIN_ONE_LINER)
    errors.one_liner = "A little more, please — around a sentence works well.";
  else if (oneLiner.length > MAX_ONE_LINER)
    errors.one_liner = `Please keep this under ${MAX_ONE_LINER} characters.`;

  if (!description) errors.description = "Describe what it is and why it matters.";
  else if (description.length < MIN_DESCRIPTION)
    errors.description = "Please add a bit more detail — a sentence or two.";
  else if (description.length > MAX_DESCRIPTION)
    errors.description = `Please keep this under ${MAX_DESCRIPTION} characters.`;

  if (!leadName) errors.lead_name = "Tell us who leads this.";
  else if (leadName.length < MIN_LEAD_NAME)
    errors.lead_name = "That looks a little short — please add a name.";
  else if (leadName.length > MAX_LEAD_NAME)
    errors.lead_name = `Please keep this under ${MAX_LEAD_NAME} characters.`;

  if (!leadEmail) errors.lead_email = "An email is required.";
  else if (!isEmail(leadEmail)) errors.lead_email = "Enter a valid email address.";

  return errors;
}

const success = (data: Record<string, unknown>) => {
  void data;
  return {
    message:
      "Received. Your project is queued for review — once a human approves it, it will appear in the showcase above.",
  };
};

export function ProjectForm() {
  const { values, errors, status, pending, formRef, set, submit, reset } = useFormSubmit({
    endpoint: "/api/projects",
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
            <Field label="Project title" required id="project-title" error={errors.title}>
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
              label="One-line summary"
              hint="What it is, in a sentence — the card blurb."
              required
              id="project-one-liner"
              error={errors.one_liner}
            >
              <TextInput
                name="one_liner"
                value={values.one_liner}
                onChange={set("one_liner")}
                maxLength={MAX_ONE_LINER}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={100}>
            <Field
              label="Description"
              hint="What it does, who it is for, and what stage the work has reached."
              required
              id="project-description"
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

          <Reveal y={16} delay={150}>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field label="Lead name" required id="project-lead-name" error={errors.lead_name}>
                <TextInput
                  name="lead_name"
                  value={values.lead_name}
                  onChange={set("lead_name")}
                  maxLength={MAX_LEAD_NAME}
                  autoComplete="name"
                />
              </Field>
              <Field label="Lead email" required id="project-lead-email" error={errors.lead_email}>
                <TextInput
                  type="email"
                  inputMode="email"
                  name="lead_email"
                  value={values.lead_email}
                  onChange={set("lead_email")}
                  maxLength={MAX_EMAIL}
                  autoComplete="email"
                />
              </Field>
            </div>
          </Reveal>

          <Reveal y={16} delay={200}>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field
                label="Disciplines"
                hint="e.g. software, hardware, medicine, design"
                id="project-disciplines"
                error={errors.disciplines}
              >
                <TextInput
                  name="disciplines"
                  value={values.disciplines}
                  onChange={set("disciplines")}
                  maxLength={MAX_DISCIPLINES}
                />
              </Field>
              <Field label="Stage" id="project-stage" error={errors.stage}>
                <Select name="stage" value={values.stage} onChange={set("stage")}>
                  <option value="">Select a stage</option>
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Reveal>

          <Reveal y={16} delay={250}>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field
                label="Tags"
                hint="Comma separated — e.g. climate, open source, water"
                id="project-tags"
                error={errors.tags}
              >
                <TextInput
                  name="tags"
                  value={values.tags}
                  onChange={set("tags")}
                  maxLength={MAX_TAGS}
                />
              </Field>
              <Field label="Location" id="project-location" error={errors.location}>
                <TextInput
                  name="location"
                  value={values.location}
                  onChange={set("location")}
                  maxLength={MAX_LOCATION}
                  placeholder="City, country"
                />
              </Field>
            </div>
          </Reveal>

          <Reveal y={16} delay={300}>
            <Field
              label="Team"
              hint="Names or roles of collaborators, if any."
              id="project-team"
              error={errors.team}
            >
              <TextInput
                name="team"
                value={values.team}
                onChange={set("team")}
                maxLength={MAX_TEAM}
              />
            </Field>
          </Reveal>

          <Reveal y={16} delay={350}>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field label="Website" hint="Optional." id="project-url" error={errors.url}>
                <TextInput
                  name="url"
                  value={values.url}
                  onChange={set("url")}
                  maxLength={MAX_URL}
                  placeholder="https://"
                />
              </Field>
              <Field label="Repository" hint="Optional." id="project-repo" error={errors.repo}>
                <TextInput
                  name="repo"
                  value={values.repo}
                  onChange={set("repo")}
                  maxLength={MAX_URL}
                  placeholder="https://github.com/…"
                />
              </Field>
            </div>
          </Reveal>

          <Reveal y={16} delay={400}>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field label="Live demo" hint="Optional." id="project-demo" error={errors.demo}>
                <TextInput
                  name="demo"
                  value={values.demo}
                  onChange={set("demo")}
                  maxLength={MAX_URL}
                  placeholder="https://"
                />
              </Field>
              <Field
                label="Cover image"
                hint="Optional — a direct image URL."
                id="project-cover-image"
                error={errors.cover_image}
              >
                <TextInput
                  name="cover_image"
                  value={values.cover_image}
                  onChange={set("cover_image")}
                  maxLength={MAX_URL}
                  placeholder="https://…/cover.jpg"
                />
              </Field>
            </div>
          </Reveal>

          <Honeypot name="company" value={values.company} onChange={set("company")} />

          <Reveal y={16} delay={450}>
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <SubmitButton loading={pending} loadingLabel="Sending project…">
                Submit a project
              </SubmitButton>
              <FormStatus status={status} />
            </div>
          </Reveal>

          <Reveal y={16} delay={500}>
            <p className="max-w-xl text-sm text-muted-foreground">
              Every submission is reviewed by a person before it is published. Approved projects
              appear in the showcase above with their current stage; you can ask us to update or
              remove yours at any time.
            </p>
          </Reveal>
        </>
      )}
    </form>
  );
}
