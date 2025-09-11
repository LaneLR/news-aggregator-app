import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, html }) {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.error("🔴 Missing SMTP configuration. Check your .env.local file.");
    throw new Error("Server is not configured to send emails.");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === "465", 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log(`🟡 Attempting to send email to: ${to}`);

    await transporter.verify();
    console.log("🟢 SMTP server connection is verified and ready.");

    const info = await transporter.sendMail({
      from: `"MorningFeeds" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Message sent successfully! Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("🔴 Error sending email with Nodemailer:", error);
    throw error;
  }
}
