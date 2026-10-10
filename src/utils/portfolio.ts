import { DEFAULT_PORTFOLIO } from '../data/defaultPortfolio';
import type { UploadedFile } from '../types/google';
import type { Block, BlockType, MediaRef, PortfolioData, Section } from '../types/portfolio';
import { defaultLayout, normalizeLayout } from './layout';

export const newId = (): string => crypto.randomUUID();

/** A fresh, mutable copy of the built-in portfolio content (the default portfolio's starting point). */
export const createDefaultPortfolio = (): PortfolioData => structuredClone(DEFAULT_PORTFOLIO);

/** A blank portfolio for any other account. */
export const createEmptyPortfolio = (fullName = ''): PortfolioData => ({
  version: 2,
  header: { fullName, designation: '', profilePhoto: null, resume: null },
  home: { heading: 'Welcome to My Portfolio', tagline: '', highlights: [] },
  about: { info: [], intro: [], more: [], ventures: [], passionsIntro: '', passions: [], closing: '' },
  skills: [],
  projects: [],
  research: [],
  experience: [],
  education: [],
  contact: { phone: '', email: '', location: '', socials: [], formspreeId: '' },
  sections: [],
  layout: defaultLayout(),
});

export const createSection = (title: string): Section => ({ id: newId(), title, blocks: [] });

export function createBlock(type: BlockType): Block {
  const id = newId();
  switch (type) {
    case 'text':
      return { id, type, content: '' };
    case 'list':
      return { id, type, ordered: false, items: [''] };
    case 'media':
      return { id, type, media: null, caption: '' };
    case 'embed':
      return { id, type, url: '' };
  }
}

export const toMediaRef = (file: UploadedFile): MediaRef => ({
  fileId: file.id,
  name: file.name,
  mimeType: file.mimeType,
  url: file.publicUrl,
});

export const isImage = (media: MediaRef): boolean => media.mimeType.startsWith('image/');

/** Extract an 11-char YouTube video ID from watch, youtu.be, shorts, live or embed URLs. */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^(www\.|m\.)/, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      id = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ?? null;
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const youTubeEmbedUrl = (videoId: string): string =>
  `https://www.youtube-nocookie.com/embed/${videoId}`;

type Obj = Record<string, unknown>;
const isObject = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.map(str) : []);
const idOf = (o: Obj): string => (typeof o.id === 'string' && o.id ? o.id : newId());
/** Normalize an array of objects, or return undefined if `v` isn't an array. */
const listOf = <T>(v: unknown, item: (o: Obj) => T): T[] | undefined =>
  Array.isArray(v) ? v.filter(isObject).map(item) : undefined;

function normalizeMedia(v: unknown): MediaRef | null {
  if (!isObject(v) || typeof v.fileId !== 'string' || typeof v.url !== 'string') return null;
  return { fileId: v.fileId, url: v.url, name: str(v.name), mimeType: str(v.mimeType) };
}

function normalizeBlock(v: unknown): Block | null {
  if (!isObject(v)) return null;
  const id = idOf(v);
  switch (v.type) {
    case 'text':
      return { id, type: 'text', content: str(v.content) };
    case 'list':
      return { id, type: 'list', ordered: Boolean(v.ordered), items: strList(v.items) };
    case 'media':
      return { id, type: 'media', media: normalizeMedia(v.media), caption: str(v.caption) };
    case 'embed':
      return { id, type: 'embed', url: str(v.url) };
    default:
      return null;
  }
}

/**
 * Coerce whatever is stored in portfolio_config.json into a valid PortfolioData.
 * Malformed entries are dropped, unknown top-level keys are preserved, and any
 * top-level section that is missing entirely (e.g. a v1 config) is taken from
 * `fallback`. An empty list that *is* present stays empty.
 */
export function normalizePortfolio(raw: unknown, fallback: PortfolioData = createDefaultPortfolio()): PortfolioData {
  const d = fallback;
  if (!isObject(raw)) return d;

  const { header, home, about, contact } = raw;

  const sections =
    listOf(raw.sections, (s) => ({
      id: idOf(s),
      title: str(s.title),
      blocks: (Array.isArray(s.blocks) ? s.blocks : []).map(normalizeBlock).filter((b): b is Block => b !== null),
    })) ?? d.sections;

  return {
    ...raw,
    version: 2,
    header: isObject(header)
      ? {
          fullName: str(header.fullName),
          designation: str(header.designation),
          profilePhoto: normalizeMedia(header.profilePhoto),
          resume: normalizeMedia(header.resume),
        }
      : d.header,

    home: isObject(home)
      ? {
          heading: str(home.heading),
          tagline: str(home.tagline),
          highlights:
            listOf(home.highlights, (o) => ({ id: idOf(o), title: str(o.title), icon: str(o.icon), color: str(o.color) })) ?? [],
        }
      : d.home,

    about: isObject(about)
      ? {
          info: listOf(about.info, (o) => ({ id: idOf(o), label: str(o.label), value: str(o.value), icon: str(o.icon) })) ?? [],
          intro: strList(about.intro),
          more: strList(about.more),
          ventures:
            listOf(about.ventures, (o) => ({ id: idOf(o), title: str(o.title), description: str(o.description), icon: str(o.icon) })) ?? [],
          passionsIntro: str(about.passionsIntro),
          passions: strList(about.passions),
          closing: str(about.closing),
        }
      : d.about,

    skills:
      listOf(raw.skills, (o) => ({ id: idOf(o), title: str(o.title), icon: str(o.icon), color: str(o.color), skills: strList(o.skills) })) ??
      d.skills,

    projects:
      listOf(raw.projects, (o) => ({
        id: idOf(o),
        name: str(o.name),
        description: str(o.description),
        link: str(o.link),
        github: str(o.github),
      })) ?? d.projects,

    research:
      listOf(raw.research, (o) => ({
        id: idOf(o),
        title: str(o.title),
        authors: str(o.authors),
        supervisor: str(o.supervisor),
        supervisorProfile: str(o.supervisorProfile),
        youtubeLink: str(o.youtubeLink),
        kaggleLink: str(o.kaggleLink),
        githubLink: str(o.githubLink),
        paperLink: str(o.paperLink),
        features: strList(o.features),
      })) ?? d.research,

    experience:
      listOf(raw.experience, (o) => ({
        id: idOf(o),
        organisation: str(o.organisation),
        role: str(o.role),
        period: str(o.period),
        summary: strList(o.summary),
      })) ?? d.experience,

    education:
      listOf(raw.education, (o) => ({
        id: idOf(o),
        degree: str(o.degree),
        institution: str(o.institution),
        location: str(o.location),
        period: str(o.period),
        description: str(o.description),
        achievements: strList(o.achievements),
      })) ?? d.education,

    contact: isObject(contact)
      ? {
          phone: str(contact.phone),
          email: str(contact.email),
          location: str(contact.location),
          socials: listOf(contact.socials, (o) => ({ id: idOf(o), label: str(o.label), url: str(o.url), icon: str(o.icon) })) ?? [],
          formspreeId: 'formspreeId' in contact ? str(contact.formspreeId) : d.contact.formspreeId,
        }
      : d.contact,

    sections,
    layout: normalizeLayout('layout' in raw ? raw.layout : d.layout, sections),
  };
}

/** Sections worth showing publicly: titled and with at least one non-empty block. */
export function publicSections(data: PortfolioData): Section[] {
  return data.sections
    .map((s) => ({ ...s, blocks: s.blocks.filter(hasContent) }))
    .filter((s) => s.title.trim() && s.blocks.length > 0);
}

export function hasContent(block: Block): boolean {
  switch (block.type) {
    case 'text':
      return block.content.trim() !== '';
    case 'list':
      return block.items.some((i) => i.trim() !== '');
    case 'media':
      return block.media !== null;
    case 'embed':
      return parseYouTubeId(block.url) !== null;
  }
}

/** Direct-download link for a publicly shared Drive file. */
export const driveDownloadUrl = (media: MediaRef): string =>
  `https://drive.google.com/uc?export=download&id=${encodeURIComponent(media.fileId)}`;

/** Drop blank entries from a list of strings (for public rendering). */
export const nonEmpty = (items: string[]): string[] => items.filter((i) => i.trim() !== '');
