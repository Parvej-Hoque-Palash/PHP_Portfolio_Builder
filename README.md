# Portfolio

Multi-user portfolio site. Each Gmail user edits their portfolio in `/dashboard`. The
content is saved as `portfolio_config.json` in their own Google Drive and shared
read-only with anyone who has the link.

Users only need a Gmail account. They sign in, build their portfolio, and click
**Save & Publish**. They never touch Netlify, GitHub or any configuration. Each user gets:

- **Personal URL:** `/php-<gmail-prefix>` (e.g. `jane.doe@gmail.com` → `/php-jane-doe`). It's activated
  automatically on save by the `registry` Netlify Function, which stores the username → Drive-file
  mapping in Netlify Blobs. The function checks with Google that the caller owns that Gmail address
  and the file, so nobody can take over someone else's URL.
- **Shareable link:** `/portfolio?id=<Drive file ID>`, shown with a **Copy Link** button in the dashboard.

## One-time setup (site owner only)

The site needs three **public** values. They aren't secrets: they end up in the public JavaScript
bundle anyway. Put them in **`src/config/siteConfig.ts`** and commit it, so that a plain
GitHub → Netlify deploy works with no Netlify configuration:

```ts
export const SITE_CONFIG = {
  googleClientId: '1234…apps.googleusercontent.com', // OAuth client for sign-in
  googleApiKey: 'AIza…',                              // browser key, restricted (see below)
  defaultUsername: 'php-yourname',                    // portfolio shown at "/"
};
```

Alternatively, leave the file empty and set `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY` and
`VITE_DEFAULT_USERNAME` as Netlify environment variables (Site configuration → Environment
variables), then redeploy. Environment variables override `siteConfig.ts`. Vite builds them in
at build time, so a change only takes effect after a new deploy.

Without a client ID, the dashboard shows *"Google login isn't configured"*. Without an API key,
public pages show *"Google API Key is not configured…"*.

Personal URLs need the site to be deployed on **Netlify**, which runs `netlify/functions/registry.ts`
and provides Blobs automatically with no setup. On other static hosts, the shareable `?id=` link
still works. `public/portfolios.json` can also list usernames by hand. It's checked first, and
`npm run dev` writes to it when you save locally.

## Local development

```bash
cp .env.example .env.local   # or fill in src/config/siteConfig.ts
npm install
npm run dev
```

## Securing the API key

The key ends up in the public JavaScript bundle, so anyone can read it. Restrict it so that it is
useless anywhere else. In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), open the key and:

1. **API restrictions → Restrict key →** select only **Google Drive API**.
2. **Application restrictions → Websites (HTTP referrers)**: add your production domain, e.g.
   `https://your-site.netlify.app/*` and any custom domain (`https://example.com/*`).
   For local development, also add `http://localhost:5173/*`, or use a separate unrestricted dev key.
3. Make sure the **Google Drive API** is enabled for the project (APIs & Services → Library).

Also add your production domain to the OAuth client's **Authorized JavaScript origins**, so that
dashboard sign-in works there.
