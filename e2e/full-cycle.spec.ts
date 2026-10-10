import { expect, test, type Browser, type Page } from '@playwright/test';
import { FOLDER, FakeDrive, PNG_1PX, TINY_PDF, installFakeGoogle } from './fakeGoogle';

/**
 * Full product cycle against the production build, with Google sign-in and Drive
 * simulated (see fakeGoogle.ts):
 *   visitor sees built-in content -> non-Gmail rejected -> owner signs in, edits,
 *   uploads, saves -> file published in Drive -> personal URL registered automatically -> visitors
 *   see the new content -> second Gmail user gets an isolated, blank portfolio.
 */

const OWNER = 'mdparvejhoque9@gmail.com';
const OWNER_SLUG = 'php-mdparvejhoque9';
const JANE = 'jane.doe@gmail.com';
const JANE_SLUG = 'php-jane-doe';

const drive = new FakeDrive();
/** Uncaught exceptions from any page; asserted empty at the end. */
const pageErrors: string[] = [];

async function openAs(browser: Browser, account: string | null): Promise<Page> {
  const context = await browser.newContext();
  await installFakeGoogle(context, drive, account);
  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(`${page.url()}: ${err.message}`));
  return page;
}

const sidebar = (page: Page) => page.locator('aside');
const saveButton = (page: Page) => page.getByRole('button', { name: 'Save & Publish' });

async function signIn(page: Page) {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Sign in with Google' }).click();
}

async function save(page: Page) {
  await saveButton(page).click();
  await expect(page.getByText(/Saved to Drive and published at/)).toBeVisible();
}


test.describe.configure({ mode: 'serial' });

test('full cycle: sign in, edit, upload, save, publish, view, second user', async ({ browser }) => {
  test.setTimeout(180_000);

  await test.step('1. visitor sees the built-in portfolio at "/" and the owner slug', async () => {
    const page = await openAs(browser, null);
    await page.goto('/');
    await expect(sidebar(page)).toContainText('Md. Parvej Hoque Palash');
    await expect(sidebar(page).getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
    await page.goto('/mdparvejhoque9/skills'); // legacy form redirects to the prefixed URL
    await expect(page).toHaveURL(`/${OWNER_SLUG}/skills`);
    await expect(page.getByRole('heading', { name: 'My Skills' })).toBeVisible();
    await page.goto('/php-nobody');
    await expect(page.getByRole('heading', { name: 'Portfolio not found' })).toBeVisible();
    await page.context().close();
  });

  await test.step('2. non-Gmail accounts are refused', async () => {
    const page = await openAs(browser, 'someone@company.com');
    await signIn(page);
    await expect(page.getByText(/Only Gmail accounts can sign in/)).toBeVisible();
    await expect(saveButton(page)).toHaveCount(0);
    await page.context().close();
  });

  const owner = await openAs(browser, OWNER);
  let ownerSectionId = '';

  await test.step('3. owner signs in and starts from the built-in content', async () => {
    await signIn(owner);
    await expect(owner.getByLabel('Full Name')).toHaveValue('Md. Parvej Hoque Palash');
    await expect(owner.getByText('Unsaved changes')).toBeVisible(); // first save publishes
    await expect(owner.getByText(/once to create your portfolio file/)).toBeVisible();
  });

  await test.step('4. owner edits profile, uploads photo + resume, adds a project and a custom section, edits the layout', async () => {
    await owner.getByLabel('Designation').fill('AI Engineer (E2E)');
    await owner.locator('input[type=file][accept="image/*"]').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG_1PX });
    await expect(owner.locator('img[alt="Profile"]')).toHaveAttribute('src', /lh3\.googleusercontent\.com\/d\//);
    await owner.getByRole('button', { name: 'Resume', exact: true }).click();
    await owner.locator('input[type=file][accept="application/pdf"]').setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: TINY_PDF });
    await expect(owner.getByText('cv.pdf')).toBeVisible();

    await owner.getByRole('button', { name: 'Projects' }).click();
    await owner.getByRole('button', { name: 'Add project' }).click();
    await owner.getByLabel('Name', { exact: true }).fill('E2E Project');
    await owner.getByLabel('Description').fill('Built by the end-to-end test.');

    await owner.getByRole('button', { name: 'Custom Sections' }).click();
    await owner.getByRole('button', { name: 'Add Section' }).click();
    await owner.getByPlaceholder('Section name, e.g. Certificates').fill('Certificates');
    await owner.getByRole('button', { name: 'Create' }).click();
    await owner.getByRole('button', { name: 'Text', exact: true }).click();
    await owner.getByPlaceholder('Write a paragraph…').fill('Certified in end-to-end testing.');
    await owner.getByRole('button', { name: 'Media', exact: true }).click();
    // > 5 MB exercises the resumable upload path
    const bigPdf = Buffer.concat([TINY_PDF, Buffer.alloc(6 * 1024 * 1024)]);
    await owner.locator('input[type=file][accept="image/*,application/pdf"]').setInputFiles({ name: 'certificate.pdf', mimeType: 'application/pdf', buffer: bigPdf });
    await expect(owner.getByText('certificate.pdf')).toBeVisible();
    await owner.getByRole('button', { name: 'YouTube', exact: true }).click();
    await owner.getByPlaceholder(/Paste a YouTube link/).fill('https://youtu.be/dQw4w9WgXcQ');
    await expect(owner.locator('iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]')).toBeVisible();

    // Layout: hide Skills, and drag Certificates to just below Home.
    await owner.getByRole('button', { name: 'Layout', exact: true }).click();
    await owner.getByLabel('Show Skills').uncheck({ force: true });
    await owner.setViewportSize({ width: 1280, height: 1600 }); // whole list on screen
    await owner.evaluate(() => window.scrollTo(0, 0));
    await owner.waitForTimeout(500); // let the card's entry animation settle before measuring
    const rows = owner.locator('[data-layout-id]');
    const handle = owner.getByRole('button', { name: 'Drag Certificates' });
    const target = rows.nth(1);
    const from = (await handle.boundingBox())!;
    const to = (await target.boundingBox())!;
    await owner.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await owner.mouse.down();
    // Move in small steps so each row the item passes gets swapped.
    for (let i = 1; i <= 40; i++) {
      await owner.mouse.move(from.x + from.width / 2, from.y + ((to.y - from.y) * i) / 40);
      await owner.waitForTimeout(25);
    }
    await owner.mouse.up();
    await expect(rows.nth(1)).toHaveAttribute('data-layout-id', /^section:/);
    await owner.setViewportSize({ width: 1280, height: 720 });
  });

  await test.step('5. save writes portfolio_config.json to the owner\'s Drive and shares it', async () => {
    await save(owner);
    const folder = drive.find(OWNER, 'My Portfolio Data')!;
    expect(folder.mimeType).toBe(FOLDER);
    expect(folder.parents).toEqual(['root']);
    const config = drive.find(OWNER, 'portfolio_config.json')!;
    expect(config.parents).toEqual([folder.id]);
    expect(config.isPublic).toBe(true);
    const json = drive.json(config) as {
      header: { designation: string; profilePhoto: unknown; resume: unknown };
      projects: { name: string }[];
      sections: { id: string; title: string; blocks: { type: string }[] }[];
      layout: { id: string; visible: boolean }[];
      updatedAt: string;
    };
    expect(json.header.designation).toBe('AI Engineer (E2E)');
    expect(json.header.profilePhoto).toBeTruthy();
    expect(json.header.resume).toBeTruthy();
    expect(json.projects.map((p) => p.name)).toContain('E2E Project');
    expect(json.sections[0].title).toBe('Certificates');
    expect(json.sections[0].blocks.map((b) => b.type)).toEqual(['text', 'media', 'embed']);
    expect(json.updatedAt).toBeTruthy();
    ownerSectionId = json.sections[0].id;
    expect(json.layout.slice(0, 3).map((l) => l.id)).toEqual(['home', `section:${ownerSectionId}`, 'about']);
    expect(json.layout.find((l) => l.id === 'skills')?.visible).toBe(false);
    // Uploaded media are public too
    for (const name of ['me.png', 'cv.pdf', 'certificate.pdf']) expect(drive.find(OWNER, name)?.isPublic).toBe(true);
    expect(drive.find(OWNER, 'certificate.pdf')!.content.length).toBeGreaterThan(6 * 1024 * 1024);
  });

  await test.step('6. saving claims the personal URL automatically (no manual registry edit)', async () => {
    await expect(owner.getByText('Public', { exact: true })).toBeVisible();
    expect(drive.registered[OWNER_SLUG]).toBe(drive.find(OWNER, 'portfolio_config.json')!.id);
    expect(drive.registry).toEqual({}); // portfolios.json untouched
  });

  await test.step('7. a signed-out visitor sees the published content', async () => {
    const visitor = await openAs(browser, null);
    await visitor.goto('/');
    await expect(sidebar(visitor)).toContainText('AI Engineer (E2E)');
    await expect(sidebar(visitor).getByRole('link', { name: 'Certificates' })).toBeVisible();
    await expect(sidebar(visitor).getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
    // Layout order and visibility apply
    await expect(sidebar(visitor).getByRole('link').nth(1)).toHaveText('Certificates');
    await expect(sidebar(visitor).getByRole('link', { name: 'Skills' })).toHaveCount(0);
    await visitor.goto(`/${OWNER_SLUG}/skills`);
    await expect(visitor).toHaveURL(`/${OWNER_SLUG}`);
    await visitor.goto('/');
    await expect(visitor.locator('img[alt="Profile"]')).toHaveAttribute('src', /lh3\.googleusercontent\.com\/d\//);

    await visitor.goto(`/${OWNER_SLUG}/projects`);
    await expect(visitor.getByText('E2E Project')).toBeVisible();

    await visitor.goto(`/${OWNER_SLUG}/section/${ownerSectionId}`);
    await expect(visitor.getByRole('heading', { name: 'Certificates' })).toBeVisible();
    await expect(visitor.getByText('Certified in end-to-end testing.')).toBeVisible();
    await expect(visitor.locator('iframe[title="certificate.pdf"]')).toBeVisible();
    await expect(visitor.locator('iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]')).toBeVisible();

    await visitor.goto('/resume');
    await expect(visitor.locator('iframe[title="Resume"]')).toHaveAttribute('src', /drive\.google\.com\/file\/d\//);
    await visitor.context().close();
  });

  await test.step('7b. the shareable /portfolio?id= link works signed-out, in Layout order', async () => {
    const link = owner.locator('code', { hasText: '/portfolio?id=' });
    await expect(link).toBeVisible();
    const url = new URL((await link.textContent())!);
    expect(url.searchParams.get('id')).toBe(drive.find(OWNER, 'portfolio_config.json')!.id);
    await expect(owner.getByRole('button', { name: 'Copy Link' })).toBeVisible();

    const visitor = await openAs(browser, null);
    await visitor.goto(url.pathname + url.search);
    const nav = visitor.getByRole('navigation', { name: 'Portfolio sections' }).getByRole('button');
    await expect(nav.first()).toHaveText('Home');
    await expect(nav.nth(1)).toHaveText('Certificates');
    await expect(nav.filter({ hasText: 'Skills' })).toHaveCount(0); // hidden in Layout
    await expect(visitor.getByText('AI Engineer (E2E)').first()).toBeVisible();
    await expect(visitor.getByText('E2E Project')).toBeVisible();
    await expect(visitor.getByText('Certified in end-to-end testing.')).toBeVisible();

    await visitor.goto('/portfolio');
    await expect(visitor.getByText('This link is missing the portfolio ID')).toBeVisible();
    await visitor.goto('/portfolio?id=doesNotExist123');
    await expect(visitor.getByRole('heading', { name: "Couldn't open this portfolio" })).toBeVisible();
    await visitor.context().close();
  });

  await test.step('8. owner sees a Dashboard link on their own portfolio, and edits persist on reload', async () => {
    await owner.goto(`/${OWNER_SLUG}`);
    await expect(sidebar(owner).getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await sidebar(owner).getByRole('link', { name: 'Dashboard' }).click();
    await expect(owner.getByLabel('Designation')).toHaveValue('AI Engineer (E2E)');
    await expect(owner.getByText('All changes saved')).toBeVisible();
    await expect(owner.getByText('Public', { exact: true })).toBeVisible();
  });

  await test.step('9. a second Gmail user gets a blank, isolated portfolio', async () => {
    const jane = await openAs(browser, JANE);
    await signIn(jane);
    await expect(jane.getByLabel('Full Name')).toHaveValue('Jane Doe');
    await expect(jane.getByLabel('Designation')).toHaveValue('');
    await jane.getByLabel('Designation').fill('Data Scientist');
    await jane.getByRole('button', { name: 'Custom Sections' }).click();
    await jane.getByRole('button', { name: 'Add Section' }).click();
    await jane.getByRole('button', { name: 'Prescriptions' }).click(); // quick-add chip
    await jane.getByRole('button', { name: 'List', exact: true }).click();
    await jane.getByPlaceholder('List item').fill('Vitamin D, 1000 IU');
    await save(jane);

    // Separate Drive data
    const janeConfig = drive.find(JANE, 'portfolio_config.json')!;
    expect(janeConfig.id).not.toBe(drive.find(OWNER, 'portfolio_config.json')!.id);
    expect(drive.find(JANE, 'My Portfolio Data')!.id).not.toBe(drive.find(OWNER, 'My Portfolio Data')!.id);
    const janeJson = drive.json(janeConfig) as { skills: unknown[]; contact: { formspreeId: string } };
    expect(janeJson.skills).toEqual([]); // no inherited content
    expect(janeJson.contact.formspreeId).toBe('');

    // Her personal URL is live right after saving
    await expect(jane.getByText(`/${JANE_SLUG}`).first()).toBeVisible();
    await expect(jane.getByText('Public', { exact: true })).toBeVisible();
    expect(drive.registered[JANE_SLUG]).toBe(janeConfig.id);
    await jane.context().close();

    const visitor = await openAs(browser, null);
    await visitor.goto('/jane-doe'); // un-prefixed form redirects
    await expect(visitor).toHaveURL(`/${JANE_SLUG}`);
    await expect(sidebar(visitor)).toContainText('Jane Doe');
    await expect(sidebar(visitor)).toContainText('Data Scientist');
    const nav = sidebar(visitor).getByRole('link');
    await expect(nav).toHaveText(['Home', 'Prescriptions']); // empty standard pages hidden
    await nav.filter({ hasText: 'Prescriptions' }).click();
    await expect(visitor.getByText('Vitamin D, 1000 IU')).toBeVisible();
    // Nothing from the default portfolio leaks into hers
    await expect(visitor.locator('body')).not.toContainText('Parvej');
    await expect(visitor.locator('body')).not.toContainText('visits');

    // The owner's portfolio is unaffected
    await visitor.goto('/');
    await expect(sidebar(visitor)).toContainText('AI Engineer (E2E)');
    await visitor.context().close();
  });

  await test.step('10. sign-out returns to the sign-in screen', async () => {
    await owner.goto('/dashboard');
    await owner.getByTitle('Sign out').click();
    await expect(owner.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
    await owner.context().close();
  });

  await test.step('11. no uncaught exceptions on any page', async () => {
    expect(pageErrors).toEqual([]);
  });
});
