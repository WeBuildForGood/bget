/**
 * Public JSON API.
 *
 * All handlers return JSON. POST bodies are validated, length-capped, and
 * written to D1 with bound parameters only. A honeypot field (`company`, or the
 * legacy `website`) short-circuits bots with a fake success.
 *
 * Every POST passes through a sliding-window, per-IP rate limiter
 * (../lib/ratelimit.js) before it touches the database, and every successful
 * write fans out to best-effort notifications (../lib/notify.js).
 *
 *   GET  /api/health
 *   GET  /api/stats             -> real row counts
 *   GET  /api/problems          -> public Problem Commons (paginated)
 *   GET  /api/problems/:slug    -> one public problem
 *   POST /api/problems          -> problems
 *   POST /api/apply             -> applications
 *   POST /api/contact           -> contact_messages
 *   POST /api/suggestions       -> suggestions
 *   POST /api/feedback          -> feedback
 *   GET  /api/projects          -> approved projects (public fields)
 *   POST /api/projects          -> projects (status = pending)
 *   GET  /api/projects/:slug
 */

import { json, methodNotAllowed } from "../lib/json.js";
import {
  asInt,
  clean,
  isEmail,
  isHoneypot,
  linkFloodFields,
  maxLen,
  minLen,
  readBody,
} from "../lib/validate.js";
import { uniqueSlug } from "../lib/slug.js";
import {
  enforceEmailCooldown,
  enforceRateLimit,
  rateLimited,
} from "../lib/ratelimit.js";
import { notifySubmission, sendConfirmation } from "../lib/notify.js";
import { sendToAll } from "../lib/mailing.js";
import { forwardToCore } from "../lib/core.js";
import { verifyAccess } from "../access.js";

/** Columns safe to expose to the public for an approved project. */
const PUBLIC_PROJECT_FIELDS = [
  "id",
  "slug",
  "title",
  "one_liner",
  "description",
  "disciplines",
  "stage",
  "url",
  "repo",
  "demo",
  "cover_image",
  "lead_name",
  "location",
  "team",
  "tags",
  "featured",
  "created_at",
].join(", ");

/**
 * Columns safe to expose for a public problem. Deliberately omits `email`,
 * `submitter_name`, `notes`, `reviewed_at`, and `user_agent`.
 */
const PUBLIC_PROBLEM_FIELDS = [
  "id",
  "slug",
  "title",
  "description",
  "affected",
  "tried",
  "success_looks_like",
  "contribution",
  "location",
  "status",
  "created_at",
].join(", ");

/** Only these problems appear in the public Problem Commons. */
const PUBLIC_PROBLEM_WHERE =
  "visibility = 'public' AND status IN ('framed', 'active')";

const KINDS = ["praise", "bug", "idea", "other"];
const VISIBILITIES = ["public", "bget", "private"];

/** Endpoints that accept a POST body and therefore need rate limiting. */
const WRITE_ENDPOINTS = new Set([
  "/api/apply",
  "/api/problems",
  "/api/contact",
  "/api/suggestions",
  "/api/feedback",
  "/api/projects",
  "/api/subscribe",
  "/api/unsubscribe",
]);

/**
 * Entry point for every non-admin `/api/*` request.
 *
 * @param {Request} request
 * @param {{DB: D1Database}} env
 * @param {ExecutionContext} ctx
 * @param {URL} url
 * @returns {Promise<Response>}
 */
export async function handlePublic(request, env, ctx, url) {
  const { pathname } = url;
  const method = request.method;
  const isRead = method === "GET" || method === "HEAD";

  // Throttle writes before any parsing or database work.
  if (method === "POST" && WRITE_ENDPOINTS.has(pathname)) {
    const limit = await enforceRateLimit(env, request, pathname);
    if (!limit.ok) return rateLimited(limit.retryAfter);
  }

  // GET /api/health
  if (pathname === "/api/health") {
    if (!isRead) return methodNotAllowed("GET, HEAD, OPTIONS");
    return health(env);
  }

  // GET /api/stats
  if (pathname === "/api/stats") {
    if (!isRead) return methodNotAllowed("GET, HEAD, OPTIONS");
    return stats(env);
  }

  // GET /api/metrics
  if (pathname === "/api/metrics") {
    if (!isRead) return methodNotAllowed("GET, HEAD, OPTIONS");
    return metrics(env);
  }

  // /api/problems (public list + create)
  if (pathname === "/api/problems") {
    if (isRead) return listProblems(env, url);
    if (method === "POST") return handleProblems(request, env, ctx);
    return methodNotAllowed("GET, POST, OPTIONS");
  }

  // /api/problems/:slug
  if (pathname.startsWith("/api/problems/")) {
    if (!isRead) return methodNotAllowed("GET, HEAD, OPTIONS");
    // A malformed percent-escape (e.g. `/api/problems/%`) makes
    // `decodeURIComponent` throw `URIError`; treat it as a bad slug (404)
    // rather than letting the top-level handler turn it into a generic 500.
    let segment;
    try {
      segment = decodeURIComponent(pathname.slice("/api/problems/".length)).replace(
        /\/+$/,
        "",
      );
    } catch {
      return json({ ok: false, error: "not_found" }, 404);
    }
    if (!segment || segment.includes("/")) {
      return json({ ok: false, error: "not_found" }, 404);
    }
    return getProblem(env, segment);
  }

  // /api/projects (list + create)
  if (pathname === "/api/projects") {
    if (isRead) return listProjects(env, url);
    if (method === "POST") return createProject(request, env, ctx);
    return methodNotAllowed("GET, POST, OPTIONS");
  }

  // /api/projects/:slug
  if (pathname.startsWith("/api/projects/")) {
    if (!isRead) return methodNotAllowed("GET, HEAD, OPTIONS");
    // Malformed percent-escape -> URIError -> treat as a bad slug (404).
    let slug;
    try {
      slug = decodeURIComponent(pathname.slice("/api/projects/".length)).replace(
        /\/+$/,
        "",
      );
    } catch {
      return json({ ok: false, error: "not_found" }, 404);
    }
    if (!slug || slug.includes("/")) {
      return json({ ok: false, error: "not_found" }, 404);
    }
    return getProjectBySlug(env, slug);
  }

  // Write-only form endpoints.
  if (pathname === "/api/apply") {
    if (method !== "POST") return methodNotAllowed("POST, OPTIONS");
    return handleApply(request, env, ctx);
  }
  if (pathname === "/api/contact") {
    if (method !== "POST") return methodNotAllowed("POST, OPTIONS");
    return handleContact(request, env, ctx);
  }
  if (pathname === "/api/suggestions") {
    if (method !== "POST") return methodNotAllowed("POST, OPTIONS");
    return handleSuggestions(request, env, ctx);
  }
  if (pathname === "/api/feedback") {
    if (method !== "POST") return methodNotAllowed("POST, OPTIONS");
    return handleFeedback(request, env, ctx);
  }

  // /api/subscribe (public write)
  if (pathname === "/api/subscribe") {
    if (method !== "POST") return methodNotAllowed("POST, OPTIONS");
    return handleSubscribe(request, env, ctx);
  }

  // /api/unsubscribe (public write)
  if (pathname === "/api/unsubscribe") {
    if (method !== "POST") return methodNotAllowed("POST, OPTIONS");
    return handleUnsubscribe(request, env, ctx);
  }

  // /api/subscribers/count (public — aggregate only, no personal data)
  if (pathname === "/api/subscribers/count") {
    if (!isRead) return methodNotAllowed("GET, HEAD, OPTIONS");
    return subscriberCount(env);
  }

  // /api/subscribers (admin read — verified HERE in the Worker, not only at
  // the Access edge). Defense in depth: the edge Access application may not
  // cover this path, and this endpoint returns real email addresses.
  if (pathname === "/api/subscribers") {
    if (!isRead) return methodNotAllowed("GET, HEAD, OPTIONS");
    const access = await verifyAccess(request, env);
    if (!access.ok) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }
    return listSubscribers(env);
  }

  return json({ ok: false, error: "not_found" }, 404);
}

/**
 * GET /api/subscribers/count -> a single aggregate number, safe for the
 * public footer counter. No personal data crosses the wire.
 */
async function subscriberCount(env) {
  try {
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM subscribers WHERE status = 'active'`
    ).first();
    return json({ ok: true, count: Number(row?.n || 0) });
  } catch (err) {
    // Table may not exist yet; report zero rather than failing the page.
    console.error("subscribers: count failed", err);
    return json({ ok: true, count: 0 });
  }
}

/* ------------------------------------------------------------------ */
/* Mailing list (subscribe / unsubscribe)                             */
/* ------------------------------------------------------------------ */

/**
 * GET /api/subscribers -> list active subscribers (admin only, protected by
 * Access in router).
 */
async function listSubscribers(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, email, name, source, status, created_at
     FROM subscribers
     WHERE status = 'active'
     ORDER BY created_at DESC`
  ).all();

  return json({
    ok: true,
    subscribers: results ?? [],
  });
}

/**
 * POST /api/subscribe -> add a subscriber.
 * Body: { email: string, name?: string, source?: string }
 * Returns: a GENERIC `202 { ok: true }` whether or not the address was already
 *          on the list. The duplicate check runs silently (the insert, the
 *          notifications, and the core forward are all skipped for a known
 *          address), so the response can never be used as an email-enumeration
 *          oracle the way the old `409 already_subscribed` could.
 */
async function handleSubscribe(request, env, ctx) {
  const parsed = await readBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.body;

  // Honeypot protection — same generic response as a real success.
  if (isHoneypot(body)) return json({ ok: true }, 202);

  const email = clean(body.email, 254).toLowerCase();
  const name = clean(body.name, 120) ?? null;
  const source = clean(body.source, 50) ?? "website";

  if (!email || !isEmail(email)) {
    return json({ ok: false, error: "invalid", fields: ["email"] }, 422);
  }

  // Check for duplicate email (regardless of status) — SILENTLY: a duplicate
  // only skips the insert/notifications below; the caller sees the exact same
  // response as for a brand-new address.
  const duplicate = await env.DB.prepare(
    `SELECT id FROM subscribers WHERE email = ? LIMIT 1`
  )
    .bind(email)
    .first();

  if (!duplicate) {
    const result = await env.DB.prepare(
      `INSERT INTO subscribers (email, name, source, status)
       VALUES (?, ?, ?, 'active')`
    )
      .bind(email, name, source)
      .run();

    const id = result.meta?.last_row_id ?? null;

    // Notify via webhook/Resend if configured (best-effort)
    notifySubmission(env, ctx, {
      type: "subscription",
      id,
      summary: `${email} (${source})`,
      data: { email, name, source },
    });
    sendConfirmation(env, ctx, { email, type: "subscription" });

    // Mirror the signup to the Navrix core's unified subscribers list.
    forwardToCore(env, ctx, "/v1/public/subscribe", {
      email,
      source: source || "website",
    });
  }

  // ALWAYS generic: 202, no id, no distinction between new and existing.
  return json({ ok: true }, 202);
}

/**
 * POST /api/unsubscribe -> remove a subscriber by email.
 * Body: { email: string }
 * Returns: a generic `202 { ok: true }` whether or not the address existed, so
 *          the route cannot confirm addresses either. Throttled twice: the
 *          per-IP limiter in `handlePublic` (this route is in WRITE_ENDPOINTS)
 *          plus a per-address cooldown here.
 *
 * BACKLOG — the proper fix is signed one-click unsubscribe: the email we send
 * carries an HMAC token proving the recipient owns the address, so only they
 * can unsubscribe it. That requires working mailing infra, which is currently
 * dead (Resend is configured but list mail is not wired), so it cannot be
 * built yet. Until then, the generic response + layered rate limits are the
 * mitigation.
 */
async function handleUnsubscribe(request, env, ctx) {
  const parsed = await readBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.body;

  // Honeypot protection — same generic response as a real success.
  if (isHoneypot(body)) return json({ ok: true }, 202);

  const email = clean(body.email, 254).toLowerCase();
  if (!email || !isEmail(email)) {
    return json({ ok: false, error: "invalid", fields: ["email"] }, 422);
  }

  // Per-address cooldown (one atomic D1 statement, salted-hash key). This
  // caps how often ONE address can be probed through this route even when the
  // attacker rotates source IPs, complementing the per-IP limiter above.
  const cooldown = await enforceEmailCooldown(env, email);
  if (!cooldown.ok) return rateLimited(cooldown.retryAfter);

  // The UPDATE is idempotent, and the response below is identical whether or
  // not a matching row existed — never confirm addresses here.
  await env.DB.prepare(
    `UPDATE subscribers
     SET status = 'unsubscribed',
         unsubscribed_at = datetime('now'),
         updated_at = datetime('now')
     WHERE email = ?`
  )
    .bind(email)
    .run();

  return json({ ok: true }, 202);
}

/* ------------------------------------------------------------------ */
/* Health + stats                                                       */
/* ------------------------------------------------------------------ */

/** GET /api/health -> liveness plus a trivial database probe. */
async function health(env) {
  let db = "ok";
  try {
    await env.DB.prepare("SELECT 1").first();
  } catch (err) {
    db = "error";
    console.error("health: db check failed", err);
  }
  return json({ ok: true, service: "buildforgood", db });
}

/** GET /api/stats -> real counts across the public collections. */
async function stats(env) {
  const row = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM applications) AS applications,
       (SELECT COUNT(*) FROM applications WHERE status='new') AS applications_new,
       (SELECT COUNT(*) FROM problems) AS problems,
       (SELECT COUNT(*) FROM problems WHERE visibility='public' AND status IN ('framed','active')) AS problems_public_open,
       (SELECT COUNT(*) FROM problems WHERE status='solved') AS problems_solved,
       (SELECT COUNT(*) FROM problems WHERE ${PUBLIC_PROBLEM_WHERE}) AS public_problems,
       (SELECT COUNT(*) FROM projects) AS projects,
       (SELECT COUNT(*) FROM projects WHERE status='approved') AS projects_approved,
       (SELECT COUNT(*) FROM projects WHERE status='approved' AND stage IN ('live','scaled')) AS projects_live,
       (SELECT COUNT(*) FROM projects WHERE status='approved' AND stage='pilot') AS projects_pilot`,
  ).first();

  return json({
    ok: true,
    applications: Number(row?.applications || 0),
    applications_total: Number(row?.applications || 0),
    applications_new: Number(row?.applications_new || 0),
    problems: Number(row?.problems || 0),
    problems_total: Number(row?.problems || 0),
    problems_public_open: Number(row?.problems_public_open || 0),
    problems_solved: Number(row?.problems_solved || 0),
    public_problems: Number(row?.public_problems || 0),
    projects: Number(row?.projects || 0),
    projects_total: Number(row?.projects || 0),
    projects_approved: Number(row?.projects_approved || 0),
    projects_live: Number(row?.projects_live || 0),
    projects_pilot: Number(row?.projects_pilot || 0),
  });
}

/** GET /api/metrics -> real, aggregate-only metrics from D1. */
async function metrics(env) {
  const row = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM problems) AS problems_total,
       (SELECT COUNT(*) FROM problems WHERE visibility='public' AND status IN ('framed','active')) AS problems_public_open,
       (SELECT COUNT(*) FROM problems WHERE status='solved') AS problems_solved,
       (SELECT COUNT(*) FROM projects) AS projects_total,
       (SELECT COUNT(*) FROM projects WHERE status='approved') AS projects_approved,
       (SELECT COUNT(*) FROM projects WHERE status='approved' AND stage IN ('live','scaled')) AS projects_live,
       (SELECT COUNT(*) FROM projects WHERE status='approved' AND stage='pilot') AS projects_pilot,
       (SELECT COUNT(*) FROM applications) AS applications_total,
       (SELECT COUNT(*) FROM applications WHERE status='new') AS applications_new`,
  ).first();

  const payload = {
    ok: true,
    problems_total: Number(row?.problems_total || 0),
    problems_public_open: Number(row?.problems_public_open || 0),
    problems_solved: Number(row?.problems_solved || 0),
    projects_total: Number(row?.projects_total || 0),
    projects_approved: Number(row?.projects_approved || 0),
    projects_live: Number(row?.projects_live || 0),
    projects_pilot: Number(row?.projects_pilot || 0),
    applications_total: Number(row?.applications_total || 0),
    applications_new: Number(row?.applications_new || 0),
  };

  // Reduce load with short cache (no PII, aggregates only).
  return json(payload, 200, { "cache-control": "max-age=60, public" });
}

/* ------------------------------------------------------------------ */
/* Problem Commons (public reads)                                       */
/* ------------------------------------------------------------------ */

/** GET /api/problems -> public, framed/active problems, newest first. */
async function listProblems(env, url) {
  const limit = asInt(url.searchParams.get("limit"), {
    min: 1,
    max: 100,
    fallback: 20,
  });
  const offset = asInt(url.searchParams.get("offset"), {
    min: 0,
    max: 1_000_000,
    fallback: 0,
  });

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM problems WHERE ${PUBLIC_PROBLEM_WHERE}`,
  ).first();

  const { results } = await env.DB.prepare(
    `SELECT ${PUBLIC_PROBLEM_FIELDS}
       FROM problems
      WHERE ${PUBLIC_PROBLEM_WHERE}
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?`,
  )
    .bind(limit, offset)
    .all();

  const problems = (results ?? []).map(publicProblem);

  return json({
    ok: true,
    problems,
    total: Number(totalRow?.n || 0),
    limit,
    offset,
  });
}

/** GET /api/problems/:slug -> one public problem. */
async function getProblem(env, segment) {
  let row = await env.DB.prepare(
    `SELECT ${PUBLIC_PROBLEM_FIELDS}
       FROM problems
      WHERE slug = ? AND ${PUBLIC_PROBLEM_WHERE}
      LIMIT 1`,
  )
    .bind(segment)
    .first();

  // Fallback: rows written before slugs existed (e.g. seeds) are still
  // addressable by their numeric id, which `publicProblem()` exposes as `slug`.
  if (!row && /^\d+$/.test(segment)) {
    row = await env.DB.prepare(
      `SELECT ${PUBLIC_PROBLEM_FIELDS}
         FROM problems
        WHERE id = ? AND ${PUBLIC_PROBLEM_WHERE}
        LIMIT 1`,
    )
      .bind(Number(segment))
      .first();
  }

  if (!row) return json({ ok: false, error: "not_found" }, 404);
  return json({ ok: true, problem: publicProblem(row) });
}

/**
 * Present a problem row for public consumption, guaranteeing a stable handle.
 *
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
function publicProblem(row) {
  return { ...row, slug: row.slug || String(row.id) };
}

/* ------------------------------------------------------------------ */
/* Form handlers                                                        */
/* ------------------------------------------------------------------ */

/** POST /api/apply -> applications */
async function handleApply(request, env, ctx) {
  const parsed = await readBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.body;
  if (isHoneypot(body)) return json({ ok: true, id: null });

  const flood = linkFloodFields(body);
  if (flood.length) {
    return json({ ok: false, error: "link_flood", fields: flood }, 422);
  }

  const fields = {
    name: clean(body.name, 120),
    email: clean(body.email, 254).toLowerCase(),
    building: clean(body.building, 5000),
  };
  const bad = fieldProblems(body, fields, {
    name: { min: 2, max: 120 },
    email: { min: 1, max: 254 },
    building: { min: 10, max: 5000 },
  });
  if (bad.length) return json({ ok: false, error: "invalid", fields: bad }, 422);
  if (!isEmail(fields.email)) {
    return json({ ok: false, error: "invalid", fields: ["email"] }, 422);
  }

  const duplicate = await env.DB.prepare(
    `SELECT id FROM applications
      WHERE email = ? AND name = ? AND created_at > datetime('now', '-24 hours')
      LIMIT 1`,
  )
    .bind(fields.email, fields.name)
    .first();
  if (duplicate) return json({ ok: false, error: "duplicate" }, 409);

  const result = await env.DB.prepare(
    `INSERT INTO applications
       (name, email, location, disciplines, links, building, struggling, why_bget, referral, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      fields.name,
      fields.email,
      clean(body.location, 160),
      clean(body.disciplines, 500),
      clean(body.links, 1000),
      fields.building,
      clean(body.struggling, 5000),
      clean(body.why_bget, 5000),
      clean(body.referral, 200),
      clean(request.headers.get("user-agent"), 400),
    )
    .run();

  const id = result.meta?.last_row_id ?? null;

  notifySubmission(env, ctx, {
    type: "application",
    id,
    summary: `${fields.name} — ${truncate(fields.building, 120)}`,
    data: {
      name: fields.name,
      email: fields.email,
      location: clean(body.location, 160),
      building: truncate(fields.building, 400),
    },
  });
  sendConfirmation(env, ctx, { email: fields.email, type: "application" });

  return json({ ok: true, id });
}

/** POST /api/problems -> problems */
async function handleProblems(request, env, ctx) {
  const parsed = await readBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.body;
  if (isHoneypot(body)) return json({ ok: true, id: null });

  const flood = linkFloodFields(body);
  if (flood.length) {
    return json({ ok: false, error: "link_flood", fields: flood }, 422);
  }

  const title = clean(body.title, 200);
  const description = clean(body.description, 8000);
  const email = clean(body.email, 254).toLowerCase();

  const bad = fieldProblems(body, { title, description, email }, {
    title: { min: 4, max: 200 },
    description: { min: 20, max: 8000 },
    email: { min: 0, max: 254 },
  });
  if (bad.length) return json({ ok: false, error: "invalid", fields: bad }, 422);
  if (email && !isEmail(email)) {
    return json({ ok: false, error: "invalid", fields: ["email"] }, 422);
  }

  const duplicate = await env.DB.prepare(
    `SELECT id FROM problems
      WHERE title = ? AND COALESCE(email, '') = ?
        AND created_at > datetime('now', '-24 hours')
      LIMIT 1`,
  )
    .bind(title, email)
    .first();
  if (duplicate) return json({ ok: false, error: "duplicate" }, 409);

  const requestedVisibility = clean(body.visibility, 20).toLowerCase();
  const visibility = VISIBILITIES.includes(requestedVisibility)
    ? requestedVisibility
    : "bget";

  const slug = await uniqueSlug(env, title, "problems");

  const result = await env.DB.prepare(
    `INSERT INTO problems
       (title, description, submitter_name, email, location, affected, tried,
        success_looks_like, why_bget, contribution, visibility, slug, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      title,
      description,
      clean(body.submitter_name, 120),
      email,
      clean(body.location, 160),
      clean(body.affected, 4000),
      clean(body.tried, 4000),
      clean(body.success_looks_like, 4000),
      clean(body.why_bget, 4000),
      clean(body.contribution, 4000),
      visibility,
      slug,
      clean(request.headers.get("user-agent"), 400),
    )
    .run();

  const id = result.meta?.last_row_id ?? null;

  notifySubmission(env, ctx, {
    type: "problem",
    id,
    summary: `${title} [${visibility}]`,
    data: {
      title,
      email,
      visibility,
      location: clean(body.location, 160),
      slug,
    },
  });
  sendConfirmation(env, ctx, { email, type: "problem" });

  return json({ ok: true, id, slug });
}

/** POST /api/contact -> contact_messages */
async function handleContact(request, env, ctx) {
  const parsed = await readBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.body;
  if (isHoneypot(body)) return json({ ok: true, id: null });

  const flood = linkFloodFields(body);
  if (flood.length) {
    return json({ ok: false, error: "link_flood", fields: flood }, 422);
  }

  const fields = {
    name: clean(body.name, 120),
    email: clean(body.email, 254).toLowerCase(),
    message: clean(body.message, 8000),
  };
  const bad = fieldProblems(body, fields, {
    name: { min: 2, max: 120 },
    email: { min: 1, max: 254 },
    message: { min: 10, max: 8000 },
  });
  if (bad.length) return json({ ok: false, error: "invalid", fields: bad }, 422);
  if (!isEmail(fields.email)) {
    return json({ ok: false, error: "invalid", fields: ["email"] }, 422);
  }

  const result = await env.DB.prepare(
    `INSERT INTO contact_messages (name, email, subject, message, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      fields.name,
      fields.email,
      clean(body.subject, 200),
      fields.message,
      clean(request.headers.get("user-agent"), 400),
    )
    .run();

  const id = result.meta?.last_row_id ?? null;

  notifySubmission(env, ctx, {
    type: "contact",
    id,
    summary: `${fields.name} — ${truncate(clean(body.subject, 200) || fields.message, 120)}`,
    data: {
      name: fields.name,
      email: fields.email,
      subject: clean(body.subject, 200),
      message: truncate(fields.message, 400),
    },
  });
  sendConfirmation(env, ctx, { email: fields.email, type: "contact" });

  // Mirror to the Navrix core so the message also appears in the Control
  // Centre's unified Contacts view (best-effort; local D1 stays canonical).
  forwardToCore(env, ctx, "/v1/public/contact", {
    name: fields.name,
    email: fields.email,
    // The core caps subject at 180 and message at 5000 chars.
    subject: truncate(clean(body.subject, 200), 180) || null,
    message: truncate(fields.message, 5000),
    metadata: {
      site: "buildforgood.world",
      local_id: id,
      page: "/contact",
    },
  });

  return json({ ok: true, id });
}

/** POST /api/suggestions -> suggestions */
async function handleSuggestions(request, env, ctx) {
  const parsed = await readBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.body;
  if (isHoneypot(body)) return json({ ok: true, id: null });

  const flood = linkFloodFields(body);
  if (flood.length) {
    return json({ ok: false, error: "link_flood", fields: flood }, 422);
  }

  const topic = clean(body.topic, 200);
  const text = clean(body.body, 8000);
  const email = clean(body.email, 254).toLowerCase();

  const bad = fieldProblems(body, { topic, body: text, email }, {
    topic: { min: 3, max: 200 },
    body: { min: 4, max: 8000 },
    email: { min: 0, max: 254 },
  });
  if (bad.length) return json({ ok: false, error: "invalid", fields: bad }, 422);
  if (email && !isEmail(email)) {
    return json({ ok: false, error: "invalid", fields: ["email"] }, 422);
  }

  const result = await env.DB.prepare(
    `INSERT INTO suggestions (topic, body, name, email, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      topic,
      text,
      clean(body.name, 120),
      email,
      clean(request.headers.get("user-agent"), 400),
    )
    .run();

  const id = result.meta?.last_row_id ?? null;

  notifySubmission(env, ctx, {
    type: "suggestion",
    id,
    summary: topic,
    data: { topic, email, body: truncate(text, 400) },
  });
  sendConfirmation(env, ctx, { email, type: "suggestion" });

  return json({ ok: true, id });
}

/** POST /api/feedback -> feedback */
async function handleFeedback(request, env, ctx) {
  const parsed = await readBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.body;
  if (isHoneypot(body)) return json({ ok: true, id: null });

  const flood = linkFloodFields(body);
  if (flood.length) {
    return json({ ok: false, error: "link_flood", fields: flood }, 422);
  }

  const text = clean(body.body, 8000);
  const bad = fieldProblems(body, { body: text }, {
    body: { min: 2, max: 8000 },
  });
  if (bad.length) return json({ ok: false, error: "invalid", fields: bad }, 422);

  const requestedKind = clean(body.kind, 20).toLowerCase();
  const kind = KINDS.includes(requestedKind) ? requestedKind : "idea";

  let rating = null;
  if (body.rating !== undefined && body.rating !== null && body.rating !== "") {
    rating = asInt(body.rating, { min: 1, max: 5, fallback: null });
    if (rating === null) {
      return json({ ok: false, error: "invalid", fields: ["rating"] }, 422);
    }
  }

  const email = clean(body.email, 254).toLowerCase();
  if (email && !isEmail(email)) {
    return json({ ok: false, error: "invalid", fields: ["email"] }, 422);
  }

  const result = await env.DB.prepare(
    `INSERT INTO feedback (kind, page, body, email, rating, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      kind,
      clean(body.page, 300),
      text,
      email,
      rating,
      clean(request.headers.get("user-agent"), 400),
    )
    .run();

  const id = result.meta?.last_row_id ?? null;

  notifySubmission(env, ctx, {
    type: "feedback",
    id,
    summary: `${kind}${rating ? ` (${rating}/5)` : ""} — ${truncate(text, 100)}`,
    data: { kind, page: clean(body.page, 300), rating, email, body: truncate(text, 400) },
  });
  sendConfirmation(env, ctx, { email, type: "feedback" });

  return json({ ok: true, id });
}

/* ------------------------------------------------------------------ */
/* Projects                                                             */
/* ------------------------------------------------------------------ */

/** GET /api/projects -> approved projects, newest/most-featured first. */
async function listProjects(env, url) {
  const limit = asInt(url.searchParams.get("limit"), {
    min: 1,
    max: 200,
    fallback: 100,
  });
  const offset = asInt(url.searchParams.get("offset"), {
    min: 0,
    max: 1_000_000,
    fallback: 0,
  });

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM projects WHERE status = 'approved'`,
  ).first();

  const { results } = await env.DB.prepare(
    `SELECT ${PUBLIC_PROJECT_FIELDS}
       FROM projects
      WHERE status = 'approved'
      ORDER BY featured DESC, created_at DESC, id DESC
      LIMIT ? OFFSET ?`,
  )
    .bind(limit, offset)
    .all();

  return json({
    ok: true,
    projects: results ?? [],
    total: Number(totalRow?.n || 0),
    limit,
    offset,
  });
}

/** GET /api/projects/:slug -> a single approved project. */
async function getProjectBySlug(env, slug) {
  const project = await env.DB.prepare(
    `SELECT ${PUBLIC_PROJECT_FIELDS}
       FROM projects
      WHERE slug = ? AND status = 'approved'
      LIMIT 1`,
  )
    .bind(slug)
    .first();

  if (!project) return json({ ok: false, error: "not_found" }, 404);
  return json({ ok: true, project });
}

/** POST /api/projects -> create a pending project submission. */
async function createProject(request, env, ctx) {
  const parsed = await readBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.body;
  if (isHoneypot(body)) return json({ ok: true, id: null, slug: null });

  const flood = linkFloodFields(body);
  if (flood.length) {
    return json({ ok: false, error: "link_flood", fields: flood }, 422);
  }

  const fields = {
    title: clean(body.title, 200),
    one_liner: clean(body.one_liner, 300),
    description: clean(body.description, 10000),
    lead_name: clean(body.lead_name, 120),
  };
  const bad = fieldProblems(body, fields, {
    title: { min: 3, max: 200 },
    one_liner: { min: 10, max: 300 },
    description: { min: 20, max: 10000 },
    lead_name: { min: 2, max: 120 },
  });
  if (bad.length) return json({ ok: false, error: "invalid", fields: bad }, 422);

  const leadEmail = clean(body.lead_email, 254).toLowerCase();
  if (leadEmail && !isEmail(leadEmail)) {
    return json({ ok: false, error: "invalid", fields: ["lead_email"] }, 422);
  }

  const slug = await uniqueSlug(env, fields.title);

  const result = await env.DB.prepare(
    `INSERT INTO projects
       (slug, title, one_liner, description, disciplines, stage, url, repo, demo, cover_image,
        lead_name, lead_email, location, team, tags, status, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
  )
    .bind(
      slug,
      fields.title,
      fields.one_liner,
      fields.description,
      clean(body.disciplines, 500),
      clean(body.stage, 40),
      clean(body.url, 500),
      clean(body.repo, 500),
      clean(body.demo, 500),
      clean(body.cover_image, 500),
      fields.lead_name,
      leadEmail,
      clean(body.location, 160),
      clean(body.team, 1000),
      clean(body.tags, 500),
      clean(request.headers.get("user-agent"), 400),
    )
    .run();

  const id = result.meta?.last_row_id ?? null;

  notifySubmission(env, ctx, {
    type: "project",
    id,
    summary: `${fields.title} — ${truncate(fields.one_liner, 120)}`,
    data: { title: fields.title, lead_name: fields.lead_name, lead_email: leadEmail, slug },
  });
  sendConfirmation(env, ctx, { email: leadEmail, type: "project" });

  return json({
    ok: true,
    id,
    slug,
  });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/**
 * Validate fields against per-field minimum/maximum lengths.
 *
 * `cleaned` supplies trimmed values for the minimum check; `body` supplies the
 * raw values for the pre-truncation maximum check. Returns the names of any
 * offending fields (empty when everything is in range).
 *
 * @param {Record<string, unknown>} body
 * @param {Record<string, string>} cleaned
 * @param {Record<string, {min?: number, max?: number}>} limits
 * @returns {string[]}
 */
function fieldProblems(body, cleaned, limits) {
  const bad = [];
  for (const [name, { min = 0, max = Infinity }] of Object.entries(limits)) {
    if (!maxLen(body?.[name], max) || !minLen(cleaned?.[name], min)) {
      bad.push(name);
    }
  }
  return bad;
}

/**
 * Collapse whitespace and trim to `max` characters, for notification summaries.
 * (Local copy so the notify payload stays compact without importing format.js.)
 *
 * @param {unknown} value
 * @param {number} max
 * @returns {string}
 */
function truncate(value, max) {
  const s = String(value ?? "").replace(/\s+/g, " ").trim();
  return s.length <= max ? s : `${s.slice(0, Math.max(0, max - 1)).trimEnd()}\u2026`;
}
