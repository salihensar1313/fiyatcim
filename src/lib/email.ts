import { Resend } from "resend";
import { logger } from "@/lib/logger";

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
    logger.warn("email_api_key_missing", { fn: "sendEmail", error: "RESEND_API_KEY not set" });
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
      logger.error("email_send_failed", { fn: "sendEmail", error: error.message });
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    logger.error("email_unexpected_error", { fn: "sendEmail", error: err instanceof Error ? err.message : String(err) });
    return { success: false, error: "Unexpected error" };
  }
}
