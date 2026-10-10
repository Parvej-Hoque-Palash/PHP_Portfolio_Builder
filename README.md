# Portfolio

Multi-user portfolio site. Each Gmail user edits their portfolio in `/dashboard`. The
content is saved as `portfolio_config.json` in their own Google Drive and shared
read-only with anyone who has the link.

- **Shareable link:** `/portfolio?id=<Drive file ID>`. It's shown with a **Copy Link** button in the
  dashboard after **Save & Publish**.
- **Username URL:** `/php-<gmail-prefix>`. This needs an entry in `public/portfolios.json`, which is
  added automatically when you save while running `npm run dev`.

## Local development

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```

## Deploying to Netlify — environment variables checklist

Vite bakes `VITE_*` variables into the JavaScript bundle at **build time**. `.env.local` is not
uploaded to Netlify, so set the variables in **Netlify → Site configuration → Environment
variables**, then **trigger a new deploy**. Changing a variable does nothing until the next build.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_GOOGLE_API_KEY` | **Yes** | Lets visitors, who aren't signed in, read published portfolio files. Without it, public pages show *"Google API Key is not configured…"*. |
| `VITE_GOOGLE_CLIENT_ID` | Yes | OAuth client used for dashboard sign-in. |
| `VITE_DEFAULT_USERNAME` or `VITE_OWNER_EMAIL` | Yes | Whose portfolio is served at `/`. |
| `VITE_PORTFOLIO_CONFIG_FILE_ID` | No | Fallback config file ID for the portfolio at `/`. |

### Securing `VITE_GOOGLE_API_KEY`

The key ends up in the public JavaScript bundle, so anyone can read it. Restrict it so that it is
useless anywhere else. In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), open the key and:

1. **API restrictions → Restrict key →** select only **Google Drive API**.
2. **Application restrictions → Websites (HTTP referrers)**: add your production domain, e.g.
   `https://your-site.netlify.app/*` and any custom domain (`https://example.com/*`).
   For local development, also add `http://localhost:5173/*`, or use a separate unrestricted dev key.
3. Make sure the **Google Drive API** is enabled for the project (APIs & Services → Library).

Also add your production domain to the OAuth client's **Authorized JavaScript origins**, so that
dashboard sign-in works there.
