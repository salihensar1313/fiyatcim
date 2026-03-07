import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Fiyatcim <noreply@fiyatcim.com>";

// Lazy init to avoid build-time crash when API key is not set
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const resend = getResend();
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not set, skipping email");
    return { success: false, error: "API key not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Send failed:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { success: false, error: "Unexpected error" };
  }
}
