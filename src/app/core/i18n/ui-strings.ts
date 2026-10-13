import { Lang } from '../../../content';
import { AreaId } from '../../office/scene/areas';

/**
 * Interface text (buttons, labels, area descriptions). This is product copy,
 * not personal content: personal content lives in src/content/.
 */

interface AreaStrings {
  name: string;
  section: string;
  blurb: string;
}

export interface UiStrings {
  site: {
    brandFallback: string;
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    language: string;
    otherLanguage: string;
    mainNav: string;
    footerNote: string;
  };
  nav: Record<'home' | 'about' | 'skills' | 'experience' | 'projects' | 'engineering' | 'education' | 'contact' | 'cv', string>;
  home: {
    eyebrow: string;
    titleFallback: string;
    introFallback: string;
    explore: string;
    tour: string;
    hint: string;
    showIntro: string;
    hideIntro: string;
    directoryTitle: string;
    directoryText: string;
  };
  office: {
    mapLabel: string;
    open: string;
    openSection: string;
    close: string;
    next: string;
    previous: string;
    areaOf: string;
  };
  areas: Record<AreaId, AreaStrings>;
  page: {
    emptyTitle: string;
    emptyText: string;
    backToOffice: string;
  };
  notFound: { title: string; text: string; back: string };
}

const en: UiStrings = {
  site: {
    brandFallback: 'Portfolio',
    skipToContent: 'Skip to content',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    language: 'Language',
    otherLanguage: 'Français',
    mainNav: 'Main navigation',
    footerNote: 'Built with Angular. The office is drawn in SVG.',
  },
  nav: {
    home: 'Office',
    about: 'About',
    skills: 'Skills',
    experience: 'Experience',
    projects: 'Projects',
    engineering: 'Case studies',
    education: 'Education',
    contact: 'Contact',
    cv: 'CV',
  },
  home: {
    eyebrow: 'Welcome to the office',
    titleFallback: 'Software development portfolio',
    introFallback: 'Walk through the office to discover projects, skills and experience.',
    explore: 'Explore the office',
    tour: 'Take the guided tour',
    hint: 'Select any area of the office to open it.',
    showIntro: 'Show introduction',
    hideIntro: 'Hide introduction',
    directoryTitle: 'Office directory',
    directoryText: 'Every area of the office, and the section it leads to.',
  },
  office: {
    mapLabel: 'Office areas',
    open: 'Open',
    openSection: 'Open section',
    close: 'Close',
    next: 'Next area',
    previous: 'Previous area',
    areaOf: 'Area {n} of {total}',
  },
  areas: {
    reception: {
      name: 'Reception',
      section: 'About me',
      blurb: 'Start here: a short introduction, the CV, and how this office is organised.',
    },
    workstation: {
      name: 'Workstation',
      section: 'Skills & experience',
      blurb: 'The desk where the daily work happens: technical skills and professional experience.',
    },
    projects: {
      name: 'Project wall',
      section: 'Projects',
      blurb: 'Selected projects. Each one has its own page with the problem, the solution and the stack.',
    },
    engineering: {
      name: 'Engineering room',
      section: 'Case studies',
      blurb: 'Where decisions are made: technical choices, trade-offs and how problems were solved.',
    },
    library: {
      name: 'Library',
      section: 'Education & certifications',
      blurb: 'Studies, certifications and continuous learning.',
    },
    lounge: {
      name: 'Lounge',
      section: 'Contact',
      blurb: 'Have a coffee and get in touch: email and professional links.',
    },
  },
  page: {
    emptyTitle: 'Coming soon',
    emptyText: 'This section is being prepared.',
    backToOffice: 'Back to the office',
  },
  notFound: {
    title: 'This room does not exist',
    text: 'The page you are looking for could not be found.',
    back: 'Return to the office',
  },
};

const fr: UiStrings = {
  site: {
    brandFallback: 'Portfolio',
    skipToContent: 'Aller au contenu',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    language: 'Langue',
    otherLanguage: 'English',
    mainNav: 'Navigation principale',
    footerNote: 'Réalisé avec Angular. Le bureau est dessiné en SVG.',
  },
  nav: {
    home: 'Bureau',
    about: 'À propos',
    skills: 'Compétences',
    experience: 'Expérience',
    projects: 'Projets',
    engineering: 'Études de cas',
    education: 'Formation',
    contact: 'Contact',
    cv: 'CV',
  },
  home: {
    eyebrow: 'Bienvenue au bureau',
    titleFallback: 'Portfolio de développement logiciel',
    introFallback: 'Parcourez le bureau pour découvrir les projets, les compétences et l’expérience.',
    explore: 'Explorer le bureau',
    tour: 'Visite guidée',
    hint: 'Sélectionnez un espace du bureau pour l’ouvrir.',
    showIntro: 'Afficher la présentation',
    hideIntro: 'Masquer la présentation',
    directoryTitle: 'Plan du bureau',
    directoryText: 'Chaque espace du bureau et la section à laquelle il mène.',
  },
  office: {
    mapLabel: 'Espaces du bureau',
    open: 'Ouvrir',
    openSection: 'Ouvrir la section',
    close: 'Fermer',
    next: 'Espace suivant',
    previous: 'Espace précédent',
    areaOf: 'Espace {n} sur {total}',
  },
  areas: {
    reception: {
      name: 'Accueil',
      section: 'À propos',
      blurb: 'Commencez ici : une courte présentation, le CV et l’organisation du bureau.',
    },
    workstation: {
      name: 'Poste de travail',
      section: 'Compétences et expérience',
      blurb: 'Le bureau du quotidien : compétences techniques et expérience professionnelle.',
    },
    projects: {
      name: 'Mur des projets',
      section: 'Projets',
      blurb: 'Une sélection de projets. Chacun a sa page : le problème, la solution et la stack.',
    },
    engineering: {
      name: 'Salle d’ingénierie',
      section: 'Études de cas',
      blurb: 'Là où se prennent les décisions : choix techniques, compromis et résolution de problèmes.',
    },
    library: {
      name: 'Bibliothèque',
      section: 'Formation et certifications',
      blurb: 'Études, certifications et apprentissage continu.',
    },
    lounge: {
      name: 'Salon',
      section: 'Contact',
      blurb: 'Prenez un café et prenons contact : e-mail et liens professionnels.',
    },
  },
  page: {
    emptyTitle: 'Bientôt disponible',
    emptyText: 'Cette section est en préparation.',
    backToOffice: 'Retour au bureau',
  },
  notFound: {
    title: 'Cette pièce n’existe pas',
    text: 'La page demandée est introuvable.',
    back: 'Retourner au bureau',
  },
};

export const UI: Record<Lang, UiStrings> = { en, fr };
