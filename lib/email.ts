/**
 * Server-side email via EmailJS REST API.
 * Requires, in the environment:
 *   EMAILJS_SERVICE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY
 * and per-purpose template ids:
 *   EMAILJS_TEMPLATE_NOTIFICATION, EMAILJS_TEMPLATE_RESET
 * In the EmailJS dashboard enable "Allow EmailJS API for non-browser
 * applications" so server calls are accepted.
 *
 * Every function is a safe no-op when the environment isn't configured, so the
 * app works with or without email.
 */

const ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

function cfg() {
  const service = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  if (!service || !publicKey || !privateKey) return null;
  return { service, publicKey, privateKey };
}

export function emailConfigured(): boolean {
  return cfg() !== null;
}

export const EMAIL_TEMPLATES = {
  notification: () => process.env.EMAILJS_TEMPLATE_NOTIFICATION ?? "",
  reset: () => process.env.EMAILJS_TEMPLATE_RESET ?? "",
};

export function appUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://docutrack-zeta.vercel.app"
  ).replace(/\/$/, "");
}

/** Fire-and-forget send. Returns false (never throws) if unconfigured or failed. */
export async function sendEmail(templateId: string, params: Record<string, string>): Promise<boolean> {
  const c = cfg();
  if (!c || !templateId) return false;
  // Provide `email` as an alias of `to_email` so the template's "To Email"
  // field works whether it references {{to_email}} or the default {{email}}.
  const template_params = { email: params.to_email, ...params };
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: c.service,
        template_id: templateId,
        user_id: c.publicKey,
        accessToken: c.privateKey,
        template_params,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
