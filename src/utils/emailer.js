// src/utils/emailer.js
import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, html }) {
  // First, check if all required environment variables are present.
  // This prevents the app from crashing if the configuration is incomplete.
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.error("🔴 Missing SMTP configuration. Check your .env.local file.");
    // Throw an error to let the calling API route know that the server
    // is not configured for sending emails.
    throw new Error("Server is not configured to send emails.");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === "465", // `secure:true` for port 465, `false` for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Add a try...catch block to capture and log detailed errors from Nodemailer.
    console.log(`🟡 Attempting to send email to: ${to}`);

    // Verify the connection to the SMTP server
    await transporter.verify();
    console.log("🟢 SMTP server connection is verified and ready.");

    // Send the email
    const info = await transporter.sendMail({
      from: `"My App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Message sent successfully! Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    // This will catch authentication errors, connection timeouts, etc.
    console.error("🔴 Error sending email with Nodemailer:", error);
    // Re-throw the error so the API route that called this function
    // can handle it and return a proper server error response.
    throw error;
  }
}
