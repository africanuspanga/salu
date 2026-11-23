// Vercel Function: receives the "Start a project" form and emails it to the sales mailbox.
// Mail goes out through the sales@salu.co.tz mailbox on the company mail server (SMTP).
//
// Set these Environment Variables in the Vercel project (Settings > Environment Variables):
//   SMTP_HOST  server22.tanzaniaservers.com
//   SMTP_PORT  465
//   SMTP_USER  sales@salu.co.tz
//   SMTP_PASS  (the sales@ mailbox password)
//   MAIL_TO    sales@salu.co.tz          (optional, defaults to SMTP_USER)
const nodemailer = require('nodemailer');

const LIMITS = { name: 120, company: 160, email: 160, phone: 60, service: 120, location: 160, message: 5000 };
const clean = (v, max) => String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, max);
const oneLine = (v) => v.replace(/[\n\t]+/g, ' ');
const esc = (v) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  // spam trap: real visitors never see or fill the "website" field
  if (body.website) return res.status(200).json({ ok: true });

  const d = {};
  for (const k of Object.keys(LIMITS)) d[k] = clean(body[k], LIMITS[k]);
  for (const k of ['name', 'company', 'email', 'phone', 'service', 'location']) d[k] = oneLine(d[k]);

  if (!d.name || !d.message || !EMAIL_RE.test(d.email)) {
    return res.status(400).json({ ok: false, error: 'Please fill in your name, a valid email and your project details.' });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('contact: SMTP environment variables are missing');
    return res.status(500).json({ ok: false, error: 'Mail is not configured.' });
  }

  const port = Number(SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const rows = [
    ['Name', d.name], ['Company', d.company || '-'], ['Email', d.email], ['Phone / WhatsApp', d.phone || '-'],
    ['Service', d.service || '-'], ['Project location', d.location || '-'],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nProject details:\n${d.message}\n\n(Sent from the contact form on www.salu.co.tz)`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0C2A3F;max-width:640px">
  <div style="border-top:4px solid #F57504;padding:18px 0 6px"><strong style="font-size:17px">New project enquiry</strong><br><span style="color:#5B6E7E">From the contact form on www.salu.co.tz</span></div>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin:12px 0">
  ${rows.map(([k, v]) => `<tr><td style="padding:7px 14px 7px 0;color:#5B6E7E;white-space:nowrap;vertical-align:top;border-bottom:1px solid #E3E9EE">${k}</td><td style="padding:7px 0;border-bottom:1px solid #E3E9EE">${esc(v)}</td></tr>`).join('')}
  </table>
  <p style="margin:18px 0 6px;color:#5B6E7E">Project details</p>
  <div style="white-space:pre-wrap;line-height:1.55;background:#EEF2F5;padding:14px 16px">${esc(d.message)}</div>
  <p style="color:#5B6E7E;font-size:12px;margin-top:18px">Press Reply to answer ${esc(d.name)} directly.</p>
</div>`;

  try {
    await transporter.sendMail({
      from: { name: 'SALU Website', address: SMTP_USER },
      to: MAIL_TO || SMTP_USER,
      replyTo: { name: d.name, address: d.email },
      subject: `Project enquiry: ${d.service || 'General'} (${d.company || d.name})`,
      text,
      html,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact: send failed', err && err.message);
    return res.status(502).json({ ok: false, error: 'Could not send right now.' });
  }
};
