import { expect, test } from '@playwright/test';
import { FakeDrive, installFakeGoogle } from './fakeGoogle';

/**
 * A fresh deployment configured through /setup: the deployer enters Gmail, Client ID
 * and API key, confirms by signing in, and the whole site switches to those settings
 * (here: the API key visitors use, and whose portfolio is at "/").
 */

const DEPLOYER = 'site.owner@gmail.com';
const DEPLOYER_SLUG = 'php-site-owner';
const RUNTIME_KEY = 'AIzaRuntimeKeyFromSetupForm0000000000';
const RUNTIME_CLIENT = '12345-runtime.apps.googleusercontent.com';

test('site owner sets up Google credentials through /setup', async ({ browser }) => {
  const drive = new FakeDrive();
  drive.siteSetup = { verified: null, pending: null }; // function deployed, nothing saved yet
  drive.apiKey = RUNTIME_KEY; // only the key from the form opens public files

  const context = await browser.newContext();
  await installFakeGoogle(context, drive, DEPLOYER);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await test.step('step 1: the form saves the settings as pending', async () => {
    await page.goto('/setup');
    await expect(page.getByRole('heading', { name: 'Step 1 of 2: connect Google' })).toBeVisible();
    await page.getByLabel('Your Gmail address (site owner)').fill(DEPLOYER);
    await page.getByLabel('Google OAuth Client ID').fill(RUNTIME_CLIENT);
    await page.getByLabel('Google API key').fill(RUNTIME_KEY);
    await page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(page.getByRole('heading', { name: 'Step 2 of 2: confirm with Google' })).toBeVisible();
    expect(drive.siteSetup!.pending?.googleClientId).toBe(RUNTIME_CLIENT);
    expect(drive.siteSetup!.verified).toBeNull();
  });

  await test.step('step 2: signing in as the owner verifies them', async () => {
    await page.getByRole('button', { name: 'Sign in with Google to confirm' }).click();
    await expect(page.getByRole('heading', { name: 'Setup complete' })).toBeVisible();
    expect(drive.siteSetup!.verified?.ownerEmail).toBe(DEPLOYER);
    expect(drive.siteSetup!.pending).toBeNull();
  });

  let shareUrl = '';
  await test.step('the dashboard runs on the new settings; the deployer owns "/"', async () => {
    await page.getByRole('button', { name: 'Open my dashboard' }).click();
    await expect(page.getByRole('link', { name: 'Site settings' })).toBeVisible(); // only for the owner
    await page.getByRole('button', { name: 'Save & Publish' }).click();
    await expect(page.getByText(/Saved to Drive and published at/)).toBeVisible();
    shareUrl = (await page.locator('code', { hasText: '/portfolio?id=' }).textContent())!;
  });

  await test.step('visitors read published files with the API key from the form', async () => {
    const visitorContext = await browser.newContext();
    await installFakeGoogle(visitorContext, drive, null);
    const visitor = await visitorContext.newPage();
    const keys: string[] = [];
    visitor.on('request', (r) => r.url().includes('alt=media') && keys.push(new URL(r.url()).searchParams.get('key') ?? ''));
    await visitor.goto(new URL(shareUrl).pathname + new URL(shareUrl).search);
    await expect(visitor.getByRole('navigation', { name: 'Portfolio sections' })).toBeVisible();
    expect(keys).toEqual([RUNTIME_KEY]);
    await visitor.goto(`/${DEPLOYER_SLUG}`);
    await expect(visitor).toHaveURL(`/${DEPLOYER_SLUG}`);
    await visitorContext.close();
  });

  await test.step('once verified, /setup is locked to the owner', async () => {
    const otherContext = await browser.newContext();
    await installFakeGoogle(otherContext, drive, 'someone.else@gmail.com');
    const other = await otherContext.newPage();
    await other.goto('/setup');
    await expect(other.getByRole('heading', { name: 'This site is set up' })).toBeVisible();
    await expect(other.getByText('Only the site owner can change these settings.')).toBeVisible();
    await expect(other.getByRole('button', { name: 'Change settings' })).toHaveCount(0);
    await otherContext.close();

    await page.goto('/setup');
    await expect(page.getByRole('button', { name: 'Change settings' })).toBeVisible(); // owner still signed in
  });

  expect(errors).toEqual([]);
  await context.close();
});
