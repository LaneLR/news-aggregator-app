import { Resend } from "resend";

let resendClient;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    console.error("🔴 Missing RESEND_API_KEY. Check your .env file.");
    throw new Error("Server is not configured to send emails.");
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendEmail({ to, subject, html }) {
  const resend = getResendClient();
  const from = process.env.EMAIL_FROM || "MorningFeeds <onboarding@resend.dev>";

  try {
    console.log(`🟡 Attempting to send email to: ${to}`);

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message || "Resend failed to send the email.");
    }

    console.log(`✅ Message sent successfully! Message ID: ${data?.id}`);
    return data;
  } catch (error) {
    console.error("🔴 Error sending email with Resend:", error);
    throw error;
  }
}
