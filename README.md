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

## Bring your own Google credentials (optional, per user)

By default, everyone signs in through the site's Google app (set up once by the owner below).
A user can instead connect **their own** Google Cloud project at **`/account`** (linked from the
sign-in page and from the dashboard as *My Google credentials*):

1. Enter their Gmail, their OAuth **Client ID** (with this site's address as an authorized
   JavaScript origin) and their **API key** (restricted to the Drive API and this site).
2. Confirm by signing in with Google through that Client ID. This proves the email is theirs and
   that the Client ID works.

After that:
- Their sign-in goes through their own Google app. The sign-in page asks for the Gmail address
  first so it can pick the right one.
- Visitors load their portfolio (`/php-…` and the share link, which carries `&u=<username>`) with
  their own API key.

Credentials are stored per user in Netlify Blobs by `netlify/functions/user-credentials.ts`. Only
the signed-in user can change or remove theirs, and new values take effect only after the same
confirm-by-sign-in step. Their Google app must be **published** (see Troubleshooting), or Google
answers `Error 403: access_denied`.

## One-time setup (site owner only)

After deploying to Netlify, open **`https://<your-site>/setup`**:

1. **Step 1:** enter your Gmail address, your Google OAuth **Client ID** and your browser **API key**.
   The form shows exactly which origin to authorize in Google Cloud Console.
2. **Step 2:** sign in with Google as that Gmail address. This proves the Client ID works and that
   you own the email. Only then does the whole site switch to the new settings.

The settings are stored in Netlify Blobs by `netlify/functions/site-config.ts`. No code changes,
environment variables or redeploys are needed. Once verified, only the owner (signed in) can change
them. Changes go through the same confirm-by-sign-in step, so a typo can't break sign-in for
everyone. Your portfolio becomes the one shown at `/`, and the dashboard shows you a
**Site settings** link.

> **Claiming a fresh deployment:** until setup is verified, whoever opens `/setup` first can claim
> the site. Do it right after deploying, or set `ownerEmail` in `src/config/siteConfig.ts` (or an
> `OWNER_EMAIL` Netlify variable) so only that Gmail address can complete setup.

**Built-in defaults:** `src/config/siteConfig.ts` (or `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY`,
`VITE_DEFAULT_USERNAME` environment variables) is used when nothing has been saved through `/setup`,
and locally with `npm run dev`. Settings verified through `/setup` override both.

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

## Troubleshooting

**"Error 403: access_denied" when someone signs in.** Your OAuth app is in **Testing** mode, which
only allows listed test users. In Google Cloud Console, open **Google Auth Platform → Audience**
(older consoles: *APIs & Services → OAuth consent screen*) and click **Publish app**. The site
only uses the `openid`, `email`, `profile` and `drive.file` scopes, so Google doesn't require an app
review for this. The sign-in page shows these steps when a sign-in doesn't finish.

**"Error 400: origin_mismatch".** Add your site address (e.g. `https://your-site.netlify.app`) to the
OAuth client's **Authorized JavaScript origins**.
