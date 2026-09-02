/** Institute email domains students must use. Server-enforced, not just UI. */
export function studentDomains(): string[] {
  return (process.env.STUDENT_EMAIL_DOMAIN ?? "mitaoe.ac.in")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function isInstituteEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return studentDomains().includes(domain);
}

export function domainHint(): string {
  return studentDomains()
    .map((d) => `@${d}`)
    .join(" or ");
}
