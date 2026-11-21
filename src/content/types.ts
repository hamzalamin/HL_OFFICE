export type Lang = 'en' | 'fr';

export interface Profile {
  name: string;

  title: string;
  location?: string;

  introduction: string;

  about: string[];

  availability?: string;

  portrait?: { src: string; alt: string };

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

  id: string;
  role: string;

  organization: string;

  label: string;
  location?: string;

  employment?: string;

  period: { start: string; end?: string } | null;

  track: 'timeline' | 'parallel';

  alongside?: string;

  overlaps?: string[];

  context?: string;

  scale?: string;

  overview: string;
  responsibilities: string[];

  technologies?: string[];

  technologiesNote?: string;

  projects?: ExperienceProject[];
}

export interface ExperienceProject {
  title: string;
  description?: string;
  technologies?: string[];
  url?: string;
  screenshots?: Screenshot[];
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

  src: string;
  alt: string;
  caption?: string;
}

export interface Project {

  slug: string;
  name: string;

  nativeName?: { text: string; lang: string; dir?: 'ltr' | 'rtl' };

  category?: string;
  summary: string;

  featured?: boolean;
  period?: string;
  role?: string;
  problem?: string;

  solution?: string;

  objectives?: string[];

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

  message?: string;
  links: ProfessionalLink[];
}

export interface Cv {

  files?: Partial<Record<Lang, string>>;

  updated?: string;
}

export interface BlogPostMeta {

  slug: string;

  lang: Lang;
  title: string;

  date: string;
  summary: string;
  tags: string[];

  minutes: number;

  draft: boolean;

  source: 'file' | 'db';

  updated: string;
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
