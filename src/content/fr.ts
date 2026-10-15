import { SHARED } from './shared';
import { PortfolioContent } from './types';

/**
 * French portfolio content (contenu en français).
 * Values starting with YOUR_ still need confirmation: they show as badges
 * while developing and are hidden from visitors. Names of technologies,
 * repositories and certifications are not translated.
 */
export const CONTENT_FR: PortfolioContent = {
  profile: {
    name: 'Hamza Lamin',
    title: 'Développeur logiciel',
    location: 'Casablanca, Maroc',
    introduction:
      "Je suis développeur logiciel basé à Casablanca, au Maroc. Je travaille sur des applications d'entreprise et des plateformes web, avec une expérience en Java, Spring Boot, Angular, React, bases de données relationnelles, tests automatisés et intégration continue. J'aime concevoir des solutions logicielles concrètes, du développement des services backend et des API jusqu'aux interfaces utilisateur.",
    about: [],
    languages: [
      { name: 'Arabe', level: 'Langue maternelle' },
      { name: 'Tamazight', level: 'Langue maternelle' },
      { name: 'Français', level: 'Intermédiaire' },
      { name: 'Anglais', level: 'Intermédiaire' },
    ],
  },

  skills: [
    { name: 'Langages de programmation', skills: ['Java', 'C', 'PHP', 'JavaScript', 'TypeScript'] },
    { name: 'Développement backend', skills: ['Spring Boot', 'Spring Framework', 'JEE', 'Hibernate', 'JPA', 'Laravel', 'SOAP', 'JAXB'] },
    { name: 'Développement frontend', skills: ['Angular', 'React'] },
    { name: 'Tests', skills: ['JUnit 5', 'Mockito', 'Selenium', 'Développement piloté par les tests (TDD)'] },
    { name: 'Bases de données', skills: ['Oracle', 'PostgreSQL', 'MySQL', 'MongoDB'] },
    { name: 'Outils et infrastructure', skills: ['Git', 'Docker', 'Linux', 'Maven', 'Jira', 'Liquibase', 'Jenkins', 'GitLab'] },
    { name: "Pratiques d'ingénierie", skills: ['Programmation orientée objet (POO)', 'Conception pilotée par le domaine (DDD)', 'Design patterns', 'Agile', 'CI/CD'] },
  ],

  experience: [
    {
      id: 'eurafric-developer',
      role: 'Développeur logiciel',
      organization: 'Eurafric Information',
      label: 'Eurafric · Développeur',
      employment: 'CDI, temps plein',
      period: { start: 'Septembre 2025' },
      track: 'timeline',
      overview: "Développement et maintenance d'applications bancaires d'entreprise avec Java, Spring Boot, Angular, Oracle et JEE.",
      responsibilities: [
        "Développer et maintenir des applications bancaires d'entreprise.",
        'Développer des services backend et les intégrer à des interfaces Angular.',
        "Travailler avec des bases de données Oracle et des environnements d'applications d'entreprise.",
        'Collaborer avec les équipes de développement, de bases de données et de déploiement.',
        'Contribuer aux tests, à la qualité du code et aux processus CI/CD.',
      ],
      technologies: ['Java', 'Spring Boot', 'Angular', 'Oracle', 'JEE', 'Jenkins', 'GitLab'],
    },
    {
      id: 'eurafric-intern',
      role: 'Stagiaire développeur logiciel',
      organization: 'Eurafric Information',
      label: 'Eurafric · Stagiaire',
      employment: 'Stage',
      period: { start: 'Avril 2025', end: 'Juillet 2025' },
      track: 'timeline',
      context: 'Système de règlement bancaire',
      overview: "Contribution au développement d'un système de règlement bancaire pour la gestion des paiements entre banques.",
      responsibilities: [
        'Développement de services backend Spring Boot.',
        'Développement d’interfaces Angular avec recherche multicritère et tableaux de données dynamiques.',
        'Mise en place de l’authentification JWT et du contrôle d’accès basé sur les rôles.',
        'Contribution à la gestion des utilisateurs et au tableau de bord administrateur.',
        "Contribution à la conteneurisation de l'application avec Docker.",
      ],
      technologies: ['Java', 'Spring Boot', 'Angular', 'Oracle', 'JWT', 'Docker'],
    },
    {
      id: 'freelance',
      role: 'Développeur logiciel freelance',
      organization: 'Freelance',
      label: 'Freelance',
      employment: 'Plusieurs clients',
      period: null,
      track: 'parallel',
      overlaps: ['eurafric-intern', 'ecowatt-intern'],
      alongside: 'En parallèle de mes études et de mes stages',
      scale: '3+ projets clients',
      overview:
        "En parallèle de mes études et de mes stages, j'ai réalisé plus de trois projets logiciels pour différents clients. Ces projets portaient sur des applications, des technologies et des besoins clients variés. Mon intervention couvrait le cycle de développement logiciel, de la compréhension des besoins des clients et de la conception initiale jusqu'à la réalisation et au déploiement.",
      responsibilities: [
        'Échanger avec les clients pour comprendre leurs besoins et leurs objectifs.',
        'Participer à la conception des projets et à la planification technique.',
        'Traduire les besoins métier en solutions logicielles concrètes.',
        'Développer des applications adaptées aux besoins de chaque client.',
        'Travailler avec différentes technologies selon les exigences de chaque projet.',
        "S'adapter à différents contextes métier et contraintes techniques.",
        "Intervenir tout au long du cycle de développement, de la conception au déploiement.",
        'Concilier le développement freelance avec mes études et mes stages.',
      ],
      technologiesNote: 'Des technologies différentes selon chaque projet.',
      projects: [],
    },
    {
      id: 'ecowatt-intern',
      role: 'Stagiaire développeur full-stack',
      organization: 'Ecowatt',
      label: 'Ecowatt · Stagiaire',
      employment: 'Stage',
      period: { start: 'Mai 2024', end: 'Juillet 2024' },
      track: 'timeline',
      overview: "Contribution au développement d'applications web avec Laravel, React.js et MySQL.",
      responsibilities: [
        'Développement de fonctionnalités backend.',
        'Mise en œuvre des opérations sur la base de données.',
        "Développement de composants d'interface responsives avec React.js.",
        "Contribution au développement full-stack de l'application.",
      ],
      technologies: ['Laravel', 'React.js', 'MySQL', 'PHP', 'JavaScript'],
    },
  ],

  projects: [
    {
      ...SHARED.projects.qatratHayat,
      name: 'Qatrat Hayat',
      category: 'Impact social · Plateforme de don de sang',
      summary:
        'Une plateforme conçue pour simplifier et accélérer la mise en relation entre les personnes ayant un besoin urgent de sang et les donneurs potentiels, principalement au Maroc et dans le monde arabe.',
      featured: true,
      period: 'YOUR_PROJECT_PERIOD',
      role: 'YOUR_PROJECT_ROLE',
      problem:
        'Face à un besoin urgent de sang, beaucoup de personnes comptent sur les réseaux sociaux comme Facebook et Instagram pour trouver des donneurs. Ces plateformes généralistes ne sont pas conçues pour les demandes urgentes, les notifications ciblées, la mise en relation selon la localisation ou une coordination efficace. Dans le même temps, de nombreux volontaires sont prêts à donner leur sang mais ne disposent pas d’une plateforme dédiée pour trouver les demandes qui les concernent et agir.',
      solution: 'Qatrat Hayat vise à offrir une plateforme dédiée qui met en relation les personnes dans le besoin et les donneurs potentiels, grâce à une expérience plus ciblée et plus intuitive.',
      objectives: [
        'Permettre de signaler des besoins en sang.',
        'Permettre aux donneurs potentiels de proposer leur aide.',
        'Faciliter la mise en relation entre les personnes dans le besoin et les donneurs potentiels à proximité.',
        'Améliorer la communication et la coordination entre les utilisateurs et les administrateurs.',
        'Offrir une expérience adaptée aux demandes urgentes de don de sang et au contexte local.',
      ],
      contribution: 'YOUR_PROJECT_CONTRIBUTION',
    },
    {
      ...SHARED.projects.apiStressLab,
      name: 'API Stress Lab',
      category: 'Bibliothèque Java · Outil pour développeurs',
      summary: 'Une bibliothèque Java de tests de charge d’API, intégrée à JUnit 5.',
      featured: true,
      features: [
        'Configuration par annotations avec @LoadTest et @EnableLoadTesting.',
        'Tests de charge basés sur un nombre de requêtes ou sur une durée.',
        'Concurrence et délais d’expiration configurables.',
        'Statistiques de débit, de temps de réponse, de taux de réussite et de codes de statut HTTP.',
      ],
    },
    {
      ...SHARED.projects.itlens,
      name: 'ITLens',
      category: "Application de gestion d'enquêtes",
      summary: "Une application de gestion d'enquêtes avec des API REST développées avec Spring Boot et Spring Data JPA, et une interface Angular dynamique.",
      implementation: [
        'API REST développées avec Spring Boot et Spring Data JPA.',
        'Interface Angular dynamique.',
        'Développée selon les principes du développement piloté par les tests.',
      ],
    },
  ],

  education: [
    { degree: "Développeur d'applications web", institution: 'YouCode | UM6P', start: '2023', end: '2025' },
    { degree: 'Baccalauréat en sciences physiques et chimiques', institution: 'Lycée Hassan Elkhayat', start: '2022', end: '2023' },
  ],

  certifications: [{ name: 'Oracle Certified Professional: Java SE 17 Developer', issuer: 'Oracle', date: '2025' }],

  contact: {
    email: SHARED.email,
    phone: SHARED.phone,
    location: 'Casablanca, Maroc',
    links: [
      { kind: 'github', label: 'GitHub', url: SHARED.links.github },
      { kind: 'linkedin', label: 'LinkedIn', url: SHARED.links.linkedin },
    ],
  },

  cv: {
    // Décommentez une fois le PDF placé dans public/cv/ :
    // file: 'cv/cv-fr.pdf',
  },
};
