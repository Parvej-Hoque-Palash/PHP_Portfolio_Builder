import type { LayoutItem, PortfolioData, Section } from '../types/portfolio';

/** Standard pages, in their default nav order. */
export const STANDARD_PAGES = ['home', 'about', 'skills', 'projects', 'research', 'experience', 'education', 'contact', 'resume'] as const;
export type StandardPage = (typeof STANDARD_PAGES)[number];

export const STANDARD_PAGE_LABELS: Record<StandardPage, string> = {
  home: 'Home',
  about: 'About',
  skills: 'Skills',
  projects: 'Projects',
  research: 'Research Work',
  experience: 'Experience',
  education: 'Education',
  contact: 'Contact',
  resume: 'Resume',
};

const SECTION_PREFIX = 'section:';

export const sectionLayoutId = (sectionId: string): string => SECTION_PREFIX + sectionId;

/** The custom section id of a layout entry, or null for a standard page. */
export const sectionIdOf = (layoutId: string): string | null =>
  layoutId.startsWith(SECTION_PREFIX) ? layoutId.slice(SECTION_PREFIX.length) : null;

export const isStandardPage = (id: string): id is StandardPage => (STANDARD_PAGES as readonly string[]).includes(id);

/** Home is the landing page, so it can be moved but never hidden. */
export const canHide = (id: string): boolean => id !== 'home';

export const defaultLayout = (sections: Section[] = []): LayoutItem[] => [
  ...STANDARD_PAGES.map((id) => ({ id, visible: true })),
  ...sections.map((s) => ({ id: sectionLayoutId(s.id), visible: true })),
];

/**
 * Coerce a stored layout into one entry per standard page and custom section:
 * stored order and visibility are kept, unknown or duplicate entries dropped,
 * and anything missing appended (visible) in default order.
 */
export function normalizeLayout(raw: unknown, sections: Section[]): LayoutItem[] {
  const known = new Set(defaultLayout(sections).map((item) => item.id));
  const seen = new Set<string>();
  const layout: LayoutItem[] = [];
  for (const entry of Array.isArray(raw) ? raw : []) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { id, visible } = entry as Record<string, unknown>;
    if (typeof id !== 'string' || !known.has(id) || seen.has(id)) continue;
    seen.add(id);
    layout.push({ id, visible: visible !== false || !canHide(id) });
  }
  for (const item of defaultLayout(sections)) if (!seen.has(item.id)) layout.push(item);
  return layout;
}

/** Whether the owner has left this page visible (pages missing from the layout are). */
export const isPageVisible = (data: PortfolioData, id: string): boolean =>
  data.layout.find((item) => item.id === id)?.visible ?? true;

/**
 * Whether a standard page has anything to show; empty pages stay out of the nav
 * even when visible.
 */
export function standardPageHasContent(data: PortfolioData, page: StandardPage): boolean {
  const { about, contact } = data;
  switch (page) {
    case 'home':
      return true;
    case 'about':
      return about.info.length > 0 || about.intro.length > 0;
    case 'contact':
      return Boolean(contact.phone || contact.email || contact.location || contact.formspreeId) || contact.socials.length > 0;
    case 'resume':
      return data.header.resume !== null;
    default:
      return data[page].length > 0;
  }
}

/** The layout entry a portfolio path (relative to its basePath) belongs to, if any. */
export function layoutIdForPath(relativePath: string): string | null {
  const [first, second] = relativePath.split('/').filter(Boolean);
  if (!first) return 'home';
  if (first === 'section') return second ? sectionLayoutId(second) : null;
  return isStandardPage(first) ? first : null;
}
