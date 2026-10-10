import type { PortfolioConfig } from './google';

/** A file stored in the user's Drive and shared publicly. */
export interface MediaRef {
  fileId: string;
  name: string;
  mimeType: string;
  url: string;
}

export interface PortfolioHeader {
  fullName: string;
  designation: string;
  profilePhoto: MediaRef | null;
  resume: MediaRef | null;
}

interface BaseBlock {
  id: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  ordered: boolean;
  items: string[];
}

export interface MediaBlock extends BaseBlock {
  type: 'media';
  media: MediaRef | null;
  caption: string;
}

export interface EmbedBlock extends BaseBlock {
  type: 'embed';
  /** The URL as the user entered it (watch, youtu.be, shorts or embed link). */
  url: string;
}

export type Block = TextBlock | ListBlock | MediaBlock | EmbedBlock;
export type BlockType = Block['type'];

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

/** Name of an icon in the ICONS registry (src/utils/icons.ts). */
export type IconName = string;

export interface HomeContent {
  heading: string;
  tagline: string;
  highlights: { id: string; title: string; icon: IconName; color: string }[];
}

export interface AboutContent {
  info: { id: string; label: string; value: string; icon: IconName }[];
  /** Paragraphs always visible. Supports **bold**. */
  intro: string[];
  /** Paragraphs revealed by "See more", shown before the ventures. */
  more: string[];
  ventures: { id: string; title: string; description: string; icon: IconName }[];
  passionsIntro: string;
  passions: string[];
  closing: string;
}

export interface SkillCategory {
  id: string;
  title: string;
  icon: IconName;
  color: string;
  skills: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  link: string;
  github: string;
}

export interface ResearchWork {
  id: string;
  title: string;
  authors: string;
  supervisor: string;
  supervisorProfile: string;
  youtubeLink: string;
  kaggleLink: string;
  githubLink: string;
  paperLink: string;
  features: string[];
}

export interface ExperienceItem {
  id: string;
  organisation: string;
  role: string;
  period: string;
  summary: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  period: string;
  description: string;
  achievements: string[];
}

export interface ContactContent {
  phone: string;
  email: string;
  location: string;
  socials: { id: string; label: string; url: string; icon: IconName }[];
  /** Formspree form ID for the contact form; empty hides the form. */
  formspreeId: string;
}

export interface PortfolioContent {
  home: HomeContent;
  about: AboutContent;
  skills: SkillCategory[];
  projects: Project[];
  research: ResearchWork[];
  experience: ExperienceItem[];
  education: EducationItem[];
  contact: ContactContent;
}

export type ContentKey = keyof PortfolioContent;

/**
 * One entry of the public navigation: a standard page ("home", "about", …, "resume")
 * or a custom section ("section:<sectionId>"). The array order is the nav order.
 */
export interface LayoutItem {
  id: string;
  visible: boolean;
}

export interface PortfolioData extends PortfolioConfig, PortfolioContent {
  version: 2;
  header: PortfolioHeader;
  sections: Section[];
  layout: LayoutItem[];
}
