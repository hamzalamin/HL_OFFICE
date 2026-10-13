/**
 * Shape of all portfolio content. Both language files (en.ts, fr.ts) must
 * satisfy `PortfolioContent`, so TypeScript reports any missing field.
 *
 * Optional fields can simply be omitted: the interface hides the matching
 * section. Values starting with `YOUR_` are placeholders: they are shown as
 * badges during development and hidden in the production build.
 */

export type Lang = 'en' | 'fr';

export interface Profile {
  name: string;
  /** e.g. the role you want to be known for. */
  title: string;
  location?: string;
  /** One or two sentences shown on the home screen and at the reception. */
  introduction: string;
  /** Longer "About me" text, one string per paragraph. */
  about: string[];
  /** Optional short line such as availability for new roles. */
  availability?: string;
  /** Path under /public, e.g. "images/portrait.webp". */
  portrait?: { src: string; alt: string };
  /** Spoken languages, e.g. { name: 'English', level: 'Intermediate' }. */
  languages?: SpokenLanguage[];
}

export interface SpokenLanguage {
  name: string;
  level: string;
}

export interface SkillGroup {
  name: string;
  skills: string[];
}

export interface Experience {
  role: string;
  organization: string;
  location?: string;
  /** Free text so you control the format, e.g. "2023" or "Jan 2023". */
  start: string;
  /** Omit for a current position. */
  end?: string;
  /** e.g. "Full-time (CDI)". */
  employment?: string;
  summary?: string;
  highlights?: string[];
  technologies?: string[];
}

export interface EngineeringDecision {
  title: string;
  context?: string;
  decision: string;
  tradeoffs?: string;
}

export interface Challenge {
  challenge: string;
  solution: string;
}

export interface Screenshot {
  /** Path under /public, e.g. "images/projects/my-project/home.webp". */
  src: string;
  alt: string;
  caption?: string;
}

export interface Project {
  /** URL segment: /projects/<slug>. Must be identical in every language. */
  slug: string;
  name: string;
  /** The name in its original script, e.g. Arabic, shown next to `name`. */
  nativeName?: { text: string; lang: string; dir?: 'ltr' | 'rtl' };
  /** e.g. "Developer tooling". */
  category?: string;
  summary: string;
  /** Shown on the project wall and listed first. */
  featured?: boolean;
  period?: string;
  role?: string;
  problem?: string;
  /** The approach taken, in a sentence or two. */
  solution?: string;
  /** Stated goals, for work that is not (yet) confirmed as implemented. */
  objectives?: string[];
  /** Implemented, verified features. */
  features?: string[];
  contribution?: string;
  stack?: string[];
  implementation?: string[];
  decisions?: EngineeringDecision[];
  challenges?: Challenge[];
  screenshots?: Screenshot[];
  repositoryUrl?: string;
  documentationUrl?: string;
  demoUrl?: string;
  /** Only verified results or measurements. */
  results?: string[];
  lessons?: string[];
  improvements?: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location?: string;
  start?: string;
  end?: string;
  description?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
  credentialUrl?: string;
}

export type LinkKind = 'github' | 'linkedin' | 'website' | 'other';

export interface ProfessionalLink {
  kind: LinkKind;
  label: string;
  url: string;
}

export interface Contact {
  email?: string;
  phone?: string;
  location?: string;
  /** Short invitation shown in the lounge, e.g. what you are open to. */
  message?: string;
  links: ProfessionalLink[];
}

export interface Cv {
  /** Path under /public, e.g. "cv/cv-en.pdf". Omit until the file exists. */
  file?: string;
  /** e.g. "October 2026" */
  updated?: string;
}

export interface PortfolioContent {
  profile: Profile;
  skills: SkillGroup[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  contact: Contact;
  cv: Cv;
}
