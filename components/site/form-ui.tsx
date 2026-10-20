"use client";

import * as React from "react";

/* ------------------------------------------------------------------ */
/* Status + errors                                                     */
/* ------------------------------------------------------------------ */

export type FieldErrors = Record<string, string>;

/**
 * Status shared by every form. Kept structurally compatible with the original
 * `{ type: "idle" | "ok" | "error"; message?: string }` shape so existing
 * consumers (e.g. the project form) keep working unchanged.
 */
export type FormStatusValue = {
  type: "idle" | "ok" | "error";
  message?: string;
  /** Optional paragraph shown under a success message. */
  detail?: string;
  /** Optional "what happens next" list shown on success. */
  next?: string[];
  /** Seconds to wait, set when the failure was a rate limit. */
  retryAfter?: number;
  /**
   * When `false`, the status region will not move focus to itself. Used when
   * validation errors already move focus to the first invalid field.
   */
  focus?: boolean;
};

const baseInput =
  "w-full min-h-11 rounded-md border border-foreground/15 bg-foreground/[0.02] px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 hover:border-foreground/25 focus:border-foreground/40 focus:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const errorInput = "border-red-400/60! hover:border-red-400/70! focus:border-red-400/80!";

/** Shared invalid styling so error state is visible, not just announced. */
function inputClass(className: string | undefined, invalid: unknown) {
  return `${baseInput} ${invalid ? errorInput : ""} ${className ?? ""}`;
}

/* ------------------------------------------------------------------ */
/* Fields                                                             */
/* ------------------------------------------------------------------ */

/**
 * Labelled field wrapper.
 *
 * Additive redesign of the original: passing `id`/`error` lets it wire
 * `id`, `aria-invalid`, `aria-describedby` and `required` onto a single child
 * control automatically. Callers that pass several children (or no `id`) keep
 * the original render, so it stays backward compatible.
 */
export function Field({
  label,
  hint,
  required,
  error,
  id,
  errorId,
  hintId,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  required?: boolean;
  error?: string;
  id?: string;
  errorId?: string;
  hintId?: string;
  children: React.ReactNode;
}) {
  const requiredMark = required ? (
    <>
      <span aria-hidden="true" className="text-[#eca8d6]">
        *
      </span>
      <span className="sr-only"> (required)</span>
    </>
  ) : null;

  // Modern path: a single, known control. Render a real <label for> so the
  // control's accessible name stays just the label, with hint/error as
  // separately referenced descriptions rather than part of the name.
  if (id && React.isValidElement(children)) {
    const hintDomId = hint ? hintId ?? `${id}-hint` : undefined;
    const errorDomId = error ? errorId ?? `${id}-error` : undefined;
    const describedBy = [errorDomId, hintDomId].filter(Boolean).join(" ") || undefined;

    const control = React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      id,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": describedBy,
      ...(required ? { required: true, "aria-required": true } : {}),
    });

    return (
      <div className="group block">
        <label
          htmlFor={id}
          className="flex items-baseline gap-2 font-mono text-sm tracking-[0.15em] uppercase text-muted-foreground transition-colors group-focus-within:text-foreground"
        >
          {label}
          {requiredMark}
        </label>
        {hint ? (
          <p id={hintDomId} className="mt-1 block text-sm text-muted-foreground/70">
            {hint}
          </p>
        ) : null}
        <div className="mt-3">{control}</div>
        {error ? (
          <p id={errorDomId} className="mt-2 block text-sm text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  // Legacy path: preserves the original wrapping-label render for callers that
  // pass several children or no `id` (e.g. the project form).
  return (
    <label className="group block">
      <span className="flex items-baseline gap-2 font-mono text-sm tracking-[0.15em] uppercase text-muted-foreground transition-colors group-focus-within:text-foreground">
        {label}
        {requiredMark}
      </span>
      {hint ? <span className="mt-1 block text-sm text-muted-foreground/70">{hint}</span> : null}
      <span className="mt-3 block">{children}</span>
    </label>
  );
}

/** Standalone inline error text, for callers that wire their own ids. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="mt-2 block text-sm text-red-400">
      {message}
    </span>
  );
}

export function TextInput(props: React.ComponentProps<"input">) {
  return <input {...props} className={inputClass(props.className, props["aria-invalid"])} />;
}

export function TextArea(props: React.ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={`${inputClass(props.className, props["aria-invalid"])} min-h-[120px] resize-y`}
    />
  );
}

export function Select(props: React.ComponentProps<"select">) {
  return (
    <select {...props} className={`${inputClass(props.className, props["aria-invalid"])} appearance-none`} />
  );
}

/** A single option in a {@link RadioGroupField}. */
export type RadioOption = {
  value: string;
  label: string;
  description?: string;
};

/**
 * Grouped radios with a real `<fieldset>`/`<legend>`. Native radios in one
 * named group give arrow-key navigation and a single tab stop for free.
 */
export function RadioGroupField({
  legend,
  hint,
  name,
  value,
  options,
  onChange,
  required,
  invalid,
  describedBy,
}: {
  legend: string;
  hint?: React.ReactNode;
  name: string;
  value: string;
  options: RadioOption[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <fieldset
      className="group min-w-0"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
    >
      <legend className="flex items-baseline gap-2 font-mono text-sm tracking-[0.15em] uppercase text-muted-foreground transition-colors group-focus-within:text-foreground">
        {legend}
        {required ? (
          <>
            <span aria-hidden="true" className="text-[#eca8d6]">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </legend>
      {hint ? (
        <p id={describedBy} className="mt-1 text-sm text-muted-foreground/70">
          {hint}
        </p>
      ) : null}
      <div className="mt-3 grid gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-foreground/15 bg-foreground/[0.02] px-4 py-3 transition-colors hover:border-foreground/25 has-[:checked]:border-foreground/40 has-[:checked]:bg-foreground/[0.04]"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#eca8d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
            <span className="min-w-0">
              <span className="block text-base text-foreground">{option.label}</span>
              {option.description ? (
                <span className="mt-0.5 block text-sm text-muted-foreground/80">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/* Honeypot + reassurance                                              */
/* ------------------------------------------------------------------ */

/**
 * Hidden anti-bot field. Real people never see it; bots fill it in and the
 * server short-circuits with a fake success. Kept out of the tab order.
 */
export function Honeypot({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="hidden">
      <label>
        {name}
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
      </label>
    </div>
  );
}

/** A short, honest note about how submitted data is handled. */
export function ReassuranceNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex max-w-xl items-start gap-3 text-sm leading-relaxed text-muted-foreground">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-[#eca8d6]"
      >
        <path
          d="M12 3 5 6v5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="m9 12 2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons + status                                                    */
/* ------------------------------------------------------------------ */

/** Inline spinner. Only animates when the visitor allows motion. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`h-4 w-4 motion-safe:animate-spin ${className}`}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SubmitButton({
  loading,
  children,
  loadingLabel = "Sending…",
}: {
  loading: boolean;
  children: React.ReactNode;
  loadingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading || undefined}
      className="hover-lift inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground px-8 text-base font-medium text-background hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:hover:transform-none sm:w-auto"
    >
      {loading ? (
        <>
          <Spinner />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Live status region for a form.
 *
 * - Success with extra context renders a panel with "what happens next" and an
 *   optional "submit another" affordance.
 * - Plain statuses keep the original single-line rendering.
 *
 * Focus moves to the region when a status appears (unless `status.focus` is
 * `false`), so keyboard and screen-reader users land on the outcome.
 */
export function FormStatus({
  status,
  onReset,
  resetLabel = "Submit another",
}: {
  status: FormStatusValue;
  onReset?: () => void;
  resetLabel?: string;
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  const setRef = React.useCallback((node: HTMLElement | null) => {
    ref.current = node;
  }, []);

  React.useEffect(() => {
    if (status.type === "idle") return;
    if (status.focus === false) return;
    ref.current?.focus();
  }, [status.type, status.message, status.focus]);

  if (status.type === "idle") return null;

  const isPanel = status.type === "ok" && Boolean(status.next?.length || status.detail || onReset);

  if (isPanel) {
    return (
      <div
        ref={setRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="animate-in fade-in slide-in-from-bottom-1 rounded-2xl border border-[#eca8d6]/35 bg-[#eca8d6]/[0.06] p-6 outline-none duration-300 focus-visible:ring-2 focus-visible:ring-[#eca8d6]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-8"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#eca8d6]/50 text-sm text-[#eca8d6]"
          >
            ✓
          </span>
          <div className="min-w-0">
            <p className="text-base font-medium text-[#eca8d6]">{status.message}</p>
            {status.detail ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{status.detail}</p>
            ) : null}
            {status.next?.length ? (
              <div className="mt-5">
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  What happens next
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {status.next.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true" className="text-[#eca8d6]/70">
                        —
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-foreground/20 px-6 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {resetLabel}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <p
      ref={setRef}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className={`animate-in fade-in slide-in-from-bottom-1 text-sm outline-none duration-300 focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        status.type === "ok" ? "text-[#eca8d6]" : "text-red-400"
      }`}
    >
      {status.message}
    </p>
  );
}
