// Provider-agnostic email sender. Inert until RESEND_API_KEY is set in the
// environment — until then every send is logged and skipped, so the app can
// ship notification hooks before an email provider is chosen.
//
// Activate by setting on the host (e.g. Render):
//   RESEND_API_KEY=re_...
//   MAIL_FROM="HRMS <hr@yourdomain.com>"   (optional; resend.dev fallback)

const FROM = process.env.MAIL_FROM || 'HRMS <onboarding@resend.dev>';

// Fire-and-forget: never throws, never blocks the API response on failure.
async function sendEmail({ to, subject, html }) {
  if (!to || !subject) return;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[mail skipped — no RESEND_API_KEY] to=${to} subject="${subject}"`);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[mail failed] ${res.status} to=${to}: ${body}`);
    }
  } catch (err) {
    console.error('[mail failed]', err.message);
  }
}

// Shared minimal dark-on-light template so notification emails look consistent.
function template(title, lines) {
  const body = lines.map((l) => `<p style="margin:0 0 12px;color:#334;font-size:14px;line-height:1.6">${l}</p>`).join('');
  return `
    <div style="max-width:520px;margin:0 auto;padding:32px 24px;font-family:Arial,Helvetica,sans-serif">
      <div style="display:flex;align-items:center;margin-bottom:24px">
        <div style="width:24px;height:24px;background:#f5a623;border-radius:5px;margin-right:10px"></div>
        <span style="font-size:12px;letter-spacing:2px;color:#888">HRMS</span>
      </div>
      <h2 style="margin:0 0 16px;color:#111;font-size:20px">${title}</h2>
      ${body}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px" />
      <p style="margin:0;color:#999;font-size:12px">This is an automated message from the HRMS portal.</p>
    </div>`;
}

module.exports = { sendEmail, template };
