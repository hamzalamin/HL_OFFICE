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
    skipToContent: string;
    language: string;
    languages: Record<Lang, string>;
    downloadCv: string;
    cvChoice: string;
    cvBoth: string;
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
  reception: { seeProjects: string; viewCv: string; getInTouch: string; languages: string };
  workstation: { skills: string };
  career: {
    journey: string;
    intro: string;
    present: string;
    parallel: string;
    overview: string;
    details: string;
    detailLevel: string;
    responsibilities: string;
    technologies: string;
    context: string;
    alsoAt: string;
    open: string;
    backToJourney: string;
    clientProjects: string;
    notFound: string;
    folders: string;
  };
  projects: { pick: string; openCaseStudy: string; notFound: string; moreOnGithub: string };
  caseStudy: {
    period: string;
    role: string;
    problem: string;
    proposedSolution: string;
    objectives: string;
    objectivesNote: string;
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
    documentation: string;
    demo: string;
    context: string;
    decision: string;
    tradeoffs: string;
    solution: string;
  };
  library: {
    cvTitle: string;
    cvPending: string;
    updated: string;
    education: string;
    certifications: string;
    credential: string;
  };
  lounge: { email: string; phone: string; copy: string; copied: string; links: string; location: string };
  notFound: { title: string; text: string; back: string };
}

const en: UiStrings = {
  site: {
    skipToContent: 'Skip to content',
    language: 'Language',
    languages: { en: 'English', fr: 'Français' },
    downloadCv: 'Download CV',
    cvChoice: 'Which version would you like?',
    cvBoth: 'Both versions',
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
      section: 'Skills',
      blurb: 'The desk where the daily work happens: the technologies and practices I work with.',
    },
    projects: {
      name: 'Project wall',
      section: 'Projects',
      blurb: 'One board per project. Open a board for the full case study.',
    },
    meeting: {
      name: 'Meeting room',
      section: 'Professional experience',
      blurb: 'The career presentation: positions, internships and freelance work.',
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
  reception: { seeProjects: 'See the projects', viewCv: 'View the CV', getInTouch: 'Get in touch', languages: 'Languages' },
  workstation: { skills: 'Skills' },
  career: {
    journey: 'Professional journey',
    intro: 'Select a folder on the table, or a role below.',
    present: 'Present',
    parallel: 'In parallel',
    overview: 'Overview',
    details: 'Responsibilities & technologies',
    detailLevel: 'Level of detail',
    responsibilities: 'Responsibilities',
    technologies: 'Technologies',
    context: 'Context',
    alsoAt: 'Also at {org}',
    open: 'View details',
    backToJourney: 'Back to the journey',
    clientProjects: 'Client projects',
    notFound: 'This experience is not in the presentation. Here is the full journey.',
    folders: 'Experience folders on the table',
  },
  projects: {
    pick: 'Select a board on the wall, or a project below.',
    openCaseStudy: 'Open the case study',
    notFound: 'This project is not on the wall. Here are the projects that are.',
    moreOnGithub: 'More projects on GitHub',
  },
  caseStudy: {
    period: 'Period',
    role: 'Role',
    problem: 'The problem',
    proposedSolution: 'Proposed solution',
    objectives: 'Objectives',
    objectivesNote: 'Stated goals of the platform.',
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
    documentation: 'Documentation',
    demo: 'Live demo',
    context: 'Context',
    decision: 'Decision',
    tradeoffs: 'Trade-offs',
    solution: 'Solution',
  },
  library: {
    cvTitle: 'Curriculum vitae',
    cvPending: 'The PDF version will be available soon.',
    updated: 'Updated',
    education: 'Education',
    certifications: 'Certifications',
    credential: 'View credential',
  },
  lounge: { email: 'Email', phone: 'Phone', copy: 'Copy', copied: 'Copied', links: 'Elsewhere', location: 'Based in' },
  notFound: {
    title: 'This room does not exist',
    text: 'The page you are looking for could not be found.',
    back: 'Return to the office',
  },
};

const fr: UiStrings = {
  site: {
    skipToContent: 'Aller au contenu',
    language: 'Langue',
    languages: { en: 'English', fr: 'Français' },
    downloadCv: 'Télécharger le CV',
    cvChoice: 'Quelle version souhaitez-vous ?',
    cvBoth: 'Les deux versions',
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
      section: 'Compétences',
      blurb: 'Le bureau du quotidien : les technologies et les pratiques avec lesquelles je travaille.',
    },
    projects: {
      name: 'Mur des projets',
      section: 'Projets',
      blurb: 'Un tableau par projet. Ouvrez un tableau pour l’étude de cas complète.',
    },
    meeting: {
      name: 'Salle de réunion',
      section: 'Expérience professionnelle',
      blurb: 'La présentation du parcours : postes, stages et travail freelance.',
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
  reception: { seeProjects: 'Voir les projets', viewCv: 'Consulter le CV', getInTouch: 'Prendre contact', languages: 'Langues' },
  workstation: { skills: 'Compétences' },
  career: {
    journey: 'Parcours professionnel',
    intro: 'Sélectionnez un dossier sur la table, ou un poste ci-dessous.',
    present: 'Aujourd’hui',
    parallel: 'En parallèle',
    overview: 'Aperçu',
    details: 'Responsabilités et technologies',
    detailLevel: 'Niveau de détail',
    responsibilities: 'Responsabilités',
    technologies: 'Technologies',
    context: 'Contexte',
    alsoAt: 'Également chez {org}',
    open: 'Voir le détail',
    backToJourney: 'Retour au parcours',
    clientProjects: 'Projets clients',
    notFound: 'Cette expérience ne figure pas dans la présentation. Voici le parcours complet.',
    folders: 'Dossiers d’expérience sur la table',
  },
  projects: {
    pick: 'Sélectionnez un tableau au mur, ou un projet ci-dessous.',
    openCaseStudy: 'Ouvrir l’étude de cas',
    notFound: 'Ce projet n’est pas au mur. Voici ceux qui y sont.',
    moreOnGithub: 'Plus de projets sur GitHub',
  },
  caseStudy: {
    period: 'Période',
    role: 'Rôle',
    problem: 'Le problème',
    proposedSolution: 'Solution proposée',
    objectives: 'Objectifs',
    objectivesNote: 'Objectifs annoncés de la plateforme.',
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
    documentation: 'Documentation',
    demo: 'Démo en ligne',
    context: 'Contexte',
    decision: 'Décision',
    tradeoffs: 'Compromis',
    solution: 'Solution',
  },
  library: {
    cvTitle: 'Curriculum vitae',
    cvPending: 'La version PDF sera bientôt disponible.',
    updated: 'Mis à jour',
    education: 'Formation',
    certifications: 'Certifications',
    credential: 'Voir le certificat',
  },
  lounge: { email: 'E-mail', phone: 'Téléphone', copy: 'Copier', copied: 'Copié', links: 'Ailleurs', location: 'Basé à' },
  notFound: {
    title: 'Cette pièce n’existe pas',
    text: 'La page demandée est introuvable.',
    back: 'Retourner au bureau',
  },
};

export const UI: Record<Lang, UiStrings> = { en, fr };
