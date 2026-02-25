const nodemailer = require('nodemailer');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'Ajaykandakatla@gmail.com').toLowerCase();
let emailTransporter = null;

function initEmailTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (smtpHost && smtpUser && smtpPass) {
    emailTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465,
      auth: { user: smtpUser, pass: smtpPass },
      family: 4, // Force IPv4 — Railway doesn't support IPv6 outbound
    });
    console.log('  Email notifications enabled via', smtpHost);
  } else {
    console.log('  Email notifications disabled (set SMTP_HOST, SMTP_USER, SMTP_PASS to enable)');
  }
}

async function sendAdminNewUserEmail(user) {
  if (!emailTransporter) return;
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  try {
    await emailTransporter.sendMail({
      from: `"ArchFlow" <${smtpFrom}>`,
      to: ADMIN_EMAIL,
      subject: `🆕 New ArchFlow User: ${user.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #6b9fdb, #9b8acc); padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 18px;">🎉 New User Sign-Up</h2>
          </div>
          <div style="background: #f8f9fb; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Name</td><td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${user.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email</td><td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${user.email}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b; font-size: 13px;">Time</td><td style="padding: 8px 0; color: #0f172a;">${new Date().toLocaleString()}</td></tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is an automated notification from ArchFlow.</p>
          </div>
        </div>
      `,
    });
    console.log('Admin notified about new user:', user.email);
  } catch (e) {
    console.error('Failed to send admin email:', e.message);
  }
}

async function sendShareInviteEmail(toEmail, role, shareUrl, ownerName, diagramName) {
  if (!emailTransporter) {
    console.log(`Share invite email skipped (SMTP not configured): ${toEmail}`);
    return;
  }
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  try {
    await emailTransporter.sendMail({
      from: `"ArchFlow" <${smtpFrom}>`,
      to: toEmail,
      subject: `${ownerName} shared "${diagramName}" with you on ArchFlow`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #6b9fdb, #9b8acc); padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 18px;">📐 Diagram Shared With You</h2>
          </div>
          <div style="background: #f8f9fb; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
            <p style="font-size: 14px; color: #0f172a; margin: 0 0 16px;"><strong>${ownerName}</strong> shared the diagram <strong>"${diagramName}"</strong> with you as <strong>${role}</strong>.</p>
            <a href="${shareUrl}" style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #6b9fdb, #9b8acc); color: white; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 8px;">Open Diagram</a>
            <p style="font-size: 12px; color: #94a3b8; margin: 16px 0 0;">Or copy this link: <a href="${shareUrl}" style="color: #6b9fdb;">${shareUrl}</a></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is an automated notification from ArchFlow.</p>
          </div>
        </div>
      `,
    });
    console.log('Share invite email sent to:', toEmail);
  } catch (e) {
    console.error('Failed to send share invite email:', e.message);
  }
}

module.exports = { initEmailTransporter, sendAdminNewUserEmail, sendShareInviteEmail };
