export const config = { runtime: "edge" }

const DEFAULT_REPORT_EMAIL = "alecorahoy@gmail.com"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

const pageLabels = {
  whole_app: "Whole App",
  analyzer: "AI Analyzer",
  validator: "Outfit Validator",
  closet: "My Closet",
  calendar: "Outfit Calendar",
  community: "Community",
  pricing: "Upgrade / Billing",
  login: "Sign In / Account",
  admin: "Admin",
  other: "Other / Not Sure",
}

const typeLabels = {
  bug: "Bug",
  not_working: "Not Working",
  feature_suggestion: "Feature Suggestion",
  other: "Other",
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

function clamp(value, max) {
  return String(value || "").trim().slice(0, max)
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function recipients() {
  return String(process.env.REPORT_EMAIL_TO || DEFAULT_REPORT_EMAIL)
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  try {
    const body = await req.json()
    const type = clamp(body.type, 40)
    const page = clamp(body.page, 80)
    const title = clamp(body.title, 160) || "Untitled report"
    const message = clamp(body.message, 3000)
    const contactEmail = clamp(body.contactEmail || body.userEmail, 180)
    const url = clamp(body.url, 600)
    const userAgent = clamp(body.userAgent, 350)
    const id = clamp(body.id, 120)
    const createdAt = clamp(body.createdAt, 80)
    const to = recipients()
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      return json({
        emailSent: false,
        reason: "missing_resend_api_key",
        to,
      })
    }

    const pageLabel = pageLabels[page] || page || "Whole App"
    const typeLabel = typeLabels[type] || "Report"
    const from = process.env.REPORT_EMAIL_FROM || "Dapper Reports <onboarding@resend.dev>"
    const subject = `[Dapper] ${typeLabel}: ${title}`.slice(0, 180)
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>")

    const text = [
      `New Dapper problem report`,
      ``,
      `Type: ${typeLabel}`,
      `Page: ${pageLabel}`,
      `Title: ${title}`,
      `Contact: ${contactEmail || "No email"}`,
      `Report ID: ${id || "unknown"}`,
      `URL: ${url || "unknown"}`,
      `Created: ${createdAt || "unknown"}`,
      ``,
      `Message:`,
      message || "(No message)",
      ``,
      `User Agent: ${userAgent || "unknown"}`,
    ].join("\n")

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a">
        <div style="border-bottom:1px solid #e5e7eb;padding-bottom:16px;margin-bottom:18px">
          <div style="font-size:12px;font-weight:800;letter-spacing:0.12em;color:#C9A84C;text-transform:uppercase">Dapper Report</div>
          <h1 style="font-size:22px;line-height:1.25;margin:6px 0 0">${escapeHtml(title)}</h1>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:7px 0;color:#64748b;font-weight:700">Type</td><td style="padding:7px 0">${escapeHtml(typeLabel)}</td></tr>
          <tr><td style="padding:7px 0;color:#64748b;font-weight:700">Page</td><td style="padding:7px 0">${escapeHtml(pageLabel)}</td></tr>
          <tr><td style="padding:7px 0;color:#64748b;font-weight:700">Contact</td><td style="padding:7px 0">${escapeHtml(contactEmail || "No email")}</td></tr>
          <tr><td style="padding:7px 0;color:#64748b;font-weight:700">Report ID</td><td style="padding:7px 0">${escapeHtml(id || "unknown")}</td></tr>
          <tr><td style="padding:7px 0;color:#64748b;font-weight:700">URL</td><td style="padding:7px 0;word-break:break-all">${escapeHtml(url || "unknown")}</td></tr>
        </table>
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-top:18px;font-size:15px;line-height:1.55">
          ${safeMessage || "(No message)"}
        </div>
        <div style="margin-top:18px;color:#94a3b8;font-size:12px;word-break:break-all">
          ${escapeHtml(userAgent || "unknown")}
        </div>
      </div>
    `

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html,
      }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return json({
        emailSent: false,
        error: data?.message || data?.error || "Could not send email notification.",
        details: data,
      }, 502)
    }

    return json({ emailSent: true, to, providerId: data?.id || "" })
  } catch (err) {
    return json({ emailSent: false, error: err.message || "Could not send email notification." }, 500)
  }
}
