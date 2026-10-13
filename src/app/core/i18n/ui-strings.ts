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
    overview: string;
    skipToContent: string;
    directory: string;
    directoryHint: string;
    language: string;
    otherLanguage: string;
    cv: string;
  };
  home: {
    eyebrow: string;
    titleFallback: string;
    introFallback: string;
    explore: string;
    hint: string;
    showIntro: string;
    quick: { projects: string; cv: string; contact: string };
  };
  office: {
    mapLabel: string;
    projectsLabel: string;
    close: string;
    next: string;
    previous: string;
    areaOf: string;
    backTo: string;
    empty: string;
  };
  areas: Record<AreaId, AreaStrings>;
  reception: { seeProjects: string; viewCv: string; getInTouch: string };
  workstation: { experience: string; skills: string; present: string; technologies: string };
  projects: { pick: string; openCaseStudy: string; notFound: string };
  caseStudy: {
    period: string;
    role: string;
    problem: string;
    features: string;
    contribution: string;
    stack: string;
    implementation: string;
    decisions: string;
    challenges: string;
    results: string;
    lessons: string;
    improvements: string;
    screenshots: string;
    repository: string;
    demo: string;
    context: string;
    decision: string;
    tradeoffs: string;
    solution: string;
  };
  engineering: { intro: string; fromProject: string };
  library: {
    cvTitle: string;
    download: string;
    cvPending: string;
    updated: string;
    education: string;
    certifications: string;
    credential: string;
  };
  lounge: { email: string; copy: string; copied: string; links: string; location: string };
  notFound: { title: string; text: string; back: string };
}

const en: UiStrings = {
  site: {
    brandFallback: 'Portfolio',
    overview: 'Office overview',
    skipToContent: 'Skip to content',
    directory: 'Directory',
    directoryHint: 'Every area of the office and what you will find there.',
    language: 'Language',
    otherLanguage: 'Français',
    cv: 'CV',
  },
  home: {
    eyebrow: 'Welcome to the office',
    titleFallback: 'Software development portfolio',
    introFallback: 'Walk through the office to discover projects, skills and experience.',
    explore: 'Explore the office',
    hint: 'Select an area or an object in the office to look closer.',
    showIntro: 'Show introduction',
    quick: { projects: 'Projects', cv: 'CV', contact: 'Contact' },
  },
  office: {
    mapLabel: 'Office areas',
    projectsLabel: 'Projects on the wall',
    close: 'Back to the office overview',
    next: 'Next area',
    previous: 'Previous area',
    areaOf: 'Area {n} of {total}',
    backTo: 'Back to the {place}',
    empty: 'This part of the office is still being prepared.',
  },
  areas: {
    reception: {
      name: 'Reception',
      section: 'About me',
      blurb: 'A short introduction and the professional profile.',
    },
    workstation: {
      name: 'Workstation',
      section: 'Experience & skills',
      blurb: 'The desk where the daily work happens: professional experience and the technologies behind it.',
    },
    projects: {
      name: 'Project wall',
      section: 'Projects',
      blurb: 'One board per project. Open a board for the full case study.',
    },
    engineering: {
      name: 'Meeting room',
      section: 'Architecture & decisions',
      blurb: 'Where decisions are made: technical challenges, architecture choices and their trade-offs.',
    },
    library: {
      name: 'Library',
      section: 'CV, education & certificates',
      blurb: 'The records: curriculum vitae, studies and certifications.',
    },
    lounge: {
      name: 'Lounge',
      section: 'Contact',
      blurb: 'Have a coffee and get in touch.',
    },
  },
  reception: { seeProjects: 'See the projects', viewCv: 'View the CV', getInTouch: 'Get in touch' },
  workstation: { experience: 'Experience', skills: 'Skills', present: 'Present', technologies: 'Technologies' },
  projects: {
    pick: 'Select a board on the wall, or a project below.',
    openCaseStudy: 'Open the case study',
    notFound: 'This project is not on the wall. Here are the projects that are.',
  },
  caseStudy: {
    period: 'Period',
    role: 'Role',
    problem: 'The problem',
    features: 'Main features',
    contribution: 'My contribution',
    stack: 'Stack',
    implementation: 'Implementation',
    decisions: 'Engineering decisions',
    challenges: 'Challenges',
    results: 'Results',
    lessons: 'Lessons learned',
    improvements: 'Possible improvements',
    screenshots: 'Screenshots',
    repository: 'Source code',
    demo: 'Live demo',
    context: 'Context',
    decision: 'Decision',
    tradeoffs: 'Trade-offs',
    solution: 'Solution',
  },
  engineering: {
    intro: 'Decisions and challenges from the projects, gathered around one table.',
    fromProject: 'From the project',
  },
  library: {
    cvTitle: 'Curriculum vitae',
    download: 'Download the CV (PDF)',
    cvPending: 'The PDF version will be available soon.',
    updated: 'Updated',
    education: 'Education',
    certifications: 'Certifications',
    credential: 'View credential',
  },
  lounge: { email: 'Email', copy: 'Copy', copied: 'Copied', links: 'Elsewhere', location: 'Based in' },
  notFound: {
    title: 'This room does not exist',
    text: 'The page you are looking for could not be found.',
    back: 'Return to the office',
  },
};

const fr: UiStrings = {
  site: {
    brandFallback: 'Portfolio',
    overview: 'Vue d’ensemble du bureau',
    skipToContent: 'Aller au contenu',
    directory: 'Plan',
    directoryHint: 'Chaque espace du bureau et ce que vous y trouverez.',
    language: 'Langue',
    otherLanguage: 'English',
    cv: 'CV',
  },
  home: {
    eyebrow: 'Bienvenue au bureau',
    titleFallback: 'Portfolio de développement logiciel',
    introFallback: 'Parcourez le bureau pour découvrir les projets, les compétences et l’expérience.',
    explore: 'Explorer le bureau',
    hint: 'Sélectionnez un espace ou un objet du bureau pour le voir de plus près.',
    showIntro: 'Afficher la présentation',
    quick: { projects: 'Projets', cv: 'CV', contact: 'Contact' },
  },
  office: {
    mapLabel: 'Espaces du bureau',
    projectsLabel: 'Projets au mur',
    close: 'Revenir à la vue d’ensemble',
    next: 'Espace suivant',
    previous: 'Espace précédent',
    areaOf: 'Espace {n} sur {total}',
    backTo: 'Retour : {place}',
    empty: 'Cette partie du bureau est en cours de préparation.',
  },
  areas: {
    reception: {
      name: 'Accueil',
      section: 'À propos',
      blurb: 'Une courte présentation et le profil professionnel.',
    },
    workstation: {
      name: 'Poste de travail',
      section: 'Expérience et compétences',
      blurb: 'Le bureau du quotidien : l’expérience professionnelle et les technologies utilisées.',
    },
    projects: {
      name: 'Mur des projets',
      section: 'Projets',
      blurb: 'Un tableau par projet. Ouvrez un tableau pour l’étude de cas complète.',
    },
    engineering: {
      name: 'Salle de réunion',
      section: 'Architecture et décisions',
      blurb: 'Là où se prennent les décisions : défis techniques, choix d’architecture et compromis.',
    },
    library: {
      name: 'Bibliothèque',
      section: 'CV, formation et certificats',
      blurb: 'Les archives : curriculum vitae, études et certifications.',
    },
    lounge: {
      name: 'Salon',
      section: 'Contact',
      blurb: 'Prenez un café et prenons contact.',
    },
  },
  reception: { seeProjects: 'Voir les projets', viewCv: 'Consulter le CV', getInTouch: 'Prendre contact' },
  workstation: { experience: 'Expérience', skills: 'Compétences', present: 'Aujourd’hui', technologies: 'Technologies' },
  projects: {
    pick: 'Sélectionnez un tableau au mur, ou un projet ci-dessous.',
    openCaseStudy: 'Ouvrir l’étude de cas',
    notFound: 'Ce projet n’est pas au mur. Voici ceux qui y sont.',
  },
  caseStudy: {
    period: 'Période',
    role: 'Rôle',
    problem: 'Le problème',
    features: 'Fonctionnalités principales',
    contribution: 'Ma contribution',
    stack: 'Stack',
    implementation: 'Mise en œuvre',
    decisions: 'Décisions techniques',
    challenges: 'Défis',
    results: 'Résultats',
    lessons: 'Enseignements',
    improvements: 'Améliorations possibles',
    screenshots: 'Captures d’écran',
    repository: 'Code source',
    demo: 'Démo en ligne',
    context: 'Contexte',
    decision: 'Décision',
    tradeoffs: 'Compromis',
    solution: 'Solution',
  },
  engineering: {
    intro: 'Les décisions et les défis des projets, réunis autour d’une même table.',
    fromProject: 'Projet',
  },
  library: {
    cvTitle: 'Curriculum vitae',
    download: 'Télécharger le CV (PDF)',
    cvPending: 'La version PDF sera bientôt disponible.',
    updated: 'Mis à jour',
    education: 'Formation',
    certifications: 'Certifications',
    credential: 'Voir le certificat',
  },
  lounge: { email: 'E-mail', copy: 'Copier', copied: 'Copié', links: 'Ailleurs', location: 'Basé à' },
  notFound: {
    title: 'Cette pièce n’existe pas',
    text: 'La page demandée est introuvable.',
    back: 'Retourner au bureau',
  },
};

export const UI: Record<Lang, UiStrings> = { en, fr };
