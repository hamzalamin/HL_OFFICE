import { CONTENT_EN } from './en';
import { CONTENT_FR } from './fr';
import { Lang, PortfolioContent } from './types';

export const CONTENT: Record<Lang, PortfolioContent> = { en: CONTENT_EN, fr: CONTENT_FR };
export * from './types';
