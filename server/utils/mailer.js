// server/utils/mailer.js
const nodemailer = require("nodemailer");

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || user;

if (!user || !pass) {
  console.warn("⚠️ EMAIL_USER or EMAIL_PASS is missing in .env");
}

const transporter = nodemailer.createTransport({
  service: "gmail", // using Gmail
  auth: {
    user,
    pass,
  },
});

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} [options.html] - HTML body (optional)
 */
async function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent:", info.messageId);
  return info;
}

module.exports = {
  sendEmail,
};
