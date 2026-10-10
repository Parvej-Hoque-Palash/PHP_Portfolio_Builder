/** Fixed signature prefix on every portfolio username, e.g. "php-mdparvejhoque9". */
export const USERNAME_PREFIX = 'php-';

/** Only Gmail accounts can sign in (googlemail.com is Gmail's alternate domain). */
const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com'];

export const isGmail = (email: string | null | undefined): boolean =>
  Boolean(email) && GMAIL_DOMAINS.includes(email!.trim().toLowerCase().split('@')[1] ?? '');

/**
 * Portfolio username for a Gmail address: prefix + local part, lower-cased,
 * "+tag" removed and dots turned into hyphens. Non-Gmail addresses get "".
 * e.g. "Palash.212+cv@gmail.com" -> "php-palash-212"
 * Gmail local parts can't contain "-", so the mapping stays unambiguous, and the
 * result is also valid as a hostname label (e.g. php-mdparvejhoque9.example.com).
 */
export function usernameFromEmail(email: string | null | undefined): string {
  if (!email || !isGmail(email)) return '';
  const local = email.trim().toLowerCase().split('@')[0].split('+')[0];
  // Gmail local parts are letters, digits and dots; drop anything else defensively.
  return USERNAME_PREFIX + local.replace(/\./g, '-').replace(/[^a-z0-9-]/g, '');
}

export const hasUsernamePrefix = (value: string): boolean => value.toLowerCase().startsWith(USERNAME_PREFIX);
