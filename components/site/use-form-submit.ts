"use client";

import * as React from "react";
import { FIELD_LABELS, linkFloodFields } from "@/components/site/form-validation";
import type { FieldErrors, FormStatusValue } from "@/components/site/form-ui";

export type { FieldErrors, FormStatusValue };

export type UseFormSubmitOptions<V extends Record<string, string>> = {
  /** API path, e.g. `/api/apply`. */
  endpoint: string;
  /** Empty starting values (also the honeypot default). */
  initial: V;
  /** Synchronous client-side validation, mirrored from the server rules. */
  validate: (values: V) => FieldErrors;
  /** Maps values to the JSON payload. Defaults to identity. */
  toPayload?: (values: V) => Record<string, unknown>;
  /** Success message / next steps, built from the response and sent values. */
  success: (data: Record<string, unknown>, values: V) => {
    message: string;
    detail?: string;
    next?: string[];
  };
};

export type UseFormSubmit<V extends Record<string, string>> = {
  values: V;
  errors: FieldErrors;
  status: FormStatusValue;
  pending: boolean;
  formRef: React.RefObject<HTMLFormElement | null>;
  /** Change handler for one field; clears that field's error as it changes. */
  set: (
    key: keyof V & string,
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /** Submit handler to attach to `<form onSubmit>`. */
  submit: (event: React.FormEvent<HTMLFormElement>) => void;
  /** Clear everything and return focus to the first control. */
  reset: () => void;
};

/** Friendly, non-technical phrasing for a 429 response. */
function rateLimitMessage(seconds: number): string {
  if (!seconds || seconds <= 1) {
    return "Too many submissions from this connection right now. Please wait a moment and try again.";
  }
  if (seconds < 60) {
    return `Too many submissions from this connection. Please try again in about ${seconds} seconds.`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `Too many submissions from this connection. Please try again in about ${minutes} minute${
    minutes === 1 ? "" : "s"
  }.`;
}

/**
 * Shared form behaviour: client validation that mirrors the Worker, submit
 * state that blocks double-sends, mapping of server `fields` back to inputs,
 * graceful 429/409/413 handling, and focus management for outcomes.
 */
export function useFormSubmit<V extends Record<string, string>>({
  endpoint,
  initial,
  validate,
  toPayload,
  success,
}: UseFormSubmitOptions<V>): UseFormSubmit<V> {
  const [values, setValues] = React.useState<V>(initial);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [status, setStatus] = React.useState<FormStatusValue>({ type: "idle" });
  const [pending, setPending] = React.useState(false);

  const pendingRef = React.useRef(false);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const focusFirstInvalid = React.useRef(false);

  // After errors render, focus the first control marked invalid (DOM order).
  React.useEffect(() => {
    if (!focusFirstInvalid.current) return;
    focusFirstInvalid.current = false;
    const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    el?.focus();
  }, [errors]);

  const set = React.useCallback(
    (key: keyof V & string) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { value } = event.target;
        setValues((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => {
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
      },
    [],
  );

  const submit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (pendingRef.current) return;

      const found = validate(values);
      const flood = linkFloodFields(values);
      for (const name of flood) {
        found[name] =
          "That's a lot of links. Please keep to a handful and put the rest in the description.";
      }

      if (Object.keys(found).length > 0) {
        setErrors(found);
        focusFirstInvalid.current = true;
        setStatus({
          type: "error",
          message: "Please fix the highlighted fields and try again.",
          focus: false,
        });
        return;
      }

      setErrors({});
      pendingRef.current = true;
      setPending(true);
      setStatus({ type: "idle" });

      const payload = toPayload ? toPayload(values) : ({ ...values } as Record<string, unknown>);

      void (async () => {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

          if (res.ok && data.ok) {
            const sent = values;
            setValues(initial);
            const info = success(data, sent);
            setStatus({
              type: "ok",
              message: info.message,
              detail: info.detail,
              next: info.next,
              focus: true,
            });
            return;
          }

          if (res.status === 429) {
            const retryAfter = Number(data.retry_after) || 0;
            setStatus({
              type: "error",
              message: rateLimitMessage(retryAfter),
              retryAfter,
              focus: true,
            });
            return;
          }

          if (res.status === 409) {
            setStatus({
              type: "error",
              message:
                "We already have this submission from the last 24 hours — there's no need to send it again.",
              focus: true,
            });
            return;
          }

          if (res.status === 422) {
            const fields = Array.isArray(data.fields)
              ? data.fields.filter((name): name is string => typeof name === "string")
              : [];
            if (fields.length > 0) {
              const fieldErrors: FieldErrors = {};
              for (const name of fields) {
                const label = FIELD_LABELS[name] ?? "field";
                fieldErrors[name] = `This ${label} wasn't accepted — please check it and try again.`;
              }
              setErrors(fieldErrors);
              focusFirstInvalid.current = true;
              setStatus({
                type: "error",
                message: "Some details weren't accepted. Please check the highlighted fields.",
                focus: false,
              });
              return;
            }
            setStatus({
              type: "error",
              message: "Some required details were missing. Please review the form and try again.",
              focus: true,
            });
            return;
          }

          if (res.status === 413) {
            setStatus({
              type: "error",
              message: "That submission was too long. Please shorten it and try again.",
              focus: true,
            });
            return;
          }

          setStatus({
            type: "error",
            message: "Something went wrong on our side. Please try again in a moment.",
            focus: true,
          });
        } catch {
          setStatus({
            type: "error",
            message: "Network error — check your connection and try again.",
            focus: true,
          });
        } finally {
          pendingRef.current = false;
          setPending(false);
        }
      })();
    },
    [endpoint, initial, success, toPayload, validate, values],
  );

  const reset = React.useCallback(() => {
    setValues(initial);
    setErrors({});
    setStatus({ type: "idle" });
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>("input, textarea, select");
      el?.focus();
    });
  }, [initial]);

  return { values, errors, status, pending, formRef, set, submit, reset };
}
