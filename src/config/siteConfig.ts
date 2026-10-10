/**
 * Public settings for this deployment, committed so that a plain GitHub -> Netlify
 * deploy works without setting any environment variables. Nothing here is a
 * secret: Vite puts these values into the public JavaScript bundle anyway.
 * A VITE_* environment variable with the same meaning overrides each value.
 *
 * Keep the API key restricted in Google Cloud Console (Drive API only, your
 * site's domains as HTTP referrers) — see README.md.
 */
export const SITE_CONFIG = {
  /** OAuth 2.0 Web client ID used for dashboard sign-in (VITE_GOOGLE_CLIENT_ID). */
  googleClientId: '442206733462-b4p4eq7o2m7gj06tdnucb7125ciads1i.apps.googleusercontent.com',
  /** Browser API key visitors use to read published portfolio files (VITE_GOOGLE_API_KEY). */
  googleApiKey: 'AIzaSyDnJcT_HB-G0N1TV1N9MmzZObx6ULlGavg',
  /** Portfolio shown at "/", e.g. "php-yourname" (VITE_DEFAULT_USERNAME). */
  defaultUsername: 'php-mdparvejhoque9',
  /**
   * The site owner: the only Gmail address allowed to complete the /setup form on a
   * fresh deployment (empty = whoever opens /setup first becomes the owner).
   */
  ownerEmail: 'mdparvejhoque9@gmail.com',
};
