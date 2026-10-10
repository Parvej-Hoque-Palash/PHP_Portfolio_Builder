import { expect, test, type Page } from '@playwright/test';
import { FakeDrive, installFakeGoogle } from './fakeGoogle';

/**
 * Per-user credentials: a user registers their own Client ID + API key at /account,
 * confirms by signing in through it, and from then on signs in through their own
 * Google app while visitors load their portfolio with their own API key. A user
 * without credentials keeps using the site's sign-in.
 */

const JANE = 'jane.doe@gmail.com';
const JANE_SLUG = 'php-jane-doe';
const JANE_CLIENT = '777-jane.apps.googleusercontent.com';
const JANE_KEY = 'AIzaJaneOwnApiKey000000000000000000000';
const SITE_CLIENT = 'e2e-client.apps.googleusercontent.com'; // from the e2e build env

/** Client IDs passed to Google's sign-in, in order. */
const clientIdsUsed = (page: Page) => page.evaluate(() => (window as unknown as { __E2E_CLIENT_IDS?: string[] }).__E2E_CLIENT_IDS ?? []);

async function enterEmail(page: Page, email: string) {
  await page.getByLabel('Your Gmail address').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
}

test('a user brings their own Google credentials', async ({ browser }) => {
  const drive = new FakeDrive();
  drive.siteSetup = { verified: null, pending: null }; // functions deployed; site credentials from the build
  drive.apiKey = 'site-key-not-accepted'; // only Jane's own key can read her published file

  const context = await browser.newContext();
  await installFakeGoogle(context, drive, JANE);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await test.step('from the dashboard, Jane opts to use her own credentials', async () => {
    await page.goto('/dashboard');
    await enterEmail(page, JANE);
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible(); // site sign-in still offered
    await page.getByRole('link', { name: /Prefer your own Google Client ID/ }).click();
    await expect(page).toHaveURL(/\/account\?email=/);
  });

  await test.step('she registers them and confirms by signing in through her Client ID', async () => {
    await expect(page.getByRole('heading', { name: 'Add your Google credentials' })).toBeVisible();
    await expect(page.getByText(`/${JANE_SLUG}`)).toBeVisible();
    await page.getByLabel('Google OAuth Client ID').fill(JANE_CLIENT);
    await page.getByLabel('Google API key').fill(JANE_KEY);
    await page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(page.getByRole('heading', { name: 'Confirm with Google' })).toBeVisible();
    expect(drive.userCredentials[JANE_SLUG].verified).toBeNull();

    await page.getByRole('button', { name: 'Sign in with Google to confirm' }).click();
    await expect(page.getByRole('heading', { name: 'Your credentials are confirmed' })).toBeVisible();
    expect(drive.userCredentials[JANE_SLUG].verified?.googleClientId).toBe(JANE_CLIENT);
    expect(await clientIdsUsed(page)).toEqual([JANE_CLIENT]);
  });

  let shareUrl = '';
  await test.step('she publishes her portfolio', async () => {
    await page.getByRole('link', { name: 'Open my dashboard' }).click();
    await page.getByLabel('Designation').fill('Data Scientist');
    await page.getByRole('button', { name: 'Save & Publish' }).click();
    await expect(page.getByText(/Saved to Drive and published at/)).toBeVisible();
    await expect(page.getByText('Public', { exact: true })).toBeVisible();
    expect(drive.registered[JANE_SLUG]).toBe(drive.find(JANE, 'portfolio_config.json')!.id);
    shareUrl = (await page.locator('code', { hasText: '/portfolio?id=' }).textContent())!;
    expect(shareUrl).toContain(`&u=${JANE_SLUG}`);
  });

  await test.step('next time, sign-in goes through her own Google app', async () => {
    await page.getByTitle('Sign out').click();
    await enterEmail(page, JANE);
    await expect(page.getByText('Using your own Google app')).toBeVisible();
    await page.getByRole('button', { name: 'Sign in with Google' }).click();
    await expect(page.getByLabel('Designation')).toHaveValue('Data Scientist');
    expect((await clientIdsUsed(page)).at(-1)).toBe(JANE_CLIENT);
  });

  await test.step('visitors load her portfolio with her own API key', async () => {
    const visitorContext = await browser.newContext();
    await installFakeGoogle(visitorContext, drive, null);
    const visitor = await visitorContext.newPage();
    const keys: string[] = [];
    visitor.on('request', (r) => r.url().includes('alt=media') && keys.push(new URL(r.url()).searchParams.get('key') ?? ''));

    await visitor.goto(`/${JANE_SLUG}`);
    await expect(visitor.locator('aside')).toContainText('Data Scientist');
    const share = new URL(shareUrl);
    await visitor.goto(share.pathname + share.search);
    await expect(visitor.getByText('Data Scientist').first()).toBeVisible();
    expect(keys).toEqual([JANE_KEY, JANE_KEY]);
    await visitorContext.close();
  });

  await test.step('a user without their own credentials uses the site sign-in', async () => {
    const bobContext = await browser.newContext();
    await installFakeGoogle(bobContext, drive, 'bob@gmail.com');
    const bob = await bobContext.newPage();
    await bob.goto('/dashboard');
    await enterEmail(bob, 'bob@gmail.com');
    await bob.getByRole('button', { name: 'Sign in with Google' }).click();
    await expect(bob.getByLabel('Designation')).toBeVisible();
    expect(await clientIdsUsed(bob)).toEqual([SITE_CLIENT]);
    await bobContext.close();
  });

  expect(errors).toEqual([]);
  await context.close();
});
