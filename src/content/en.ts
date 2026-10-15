import { SHARED } from './shared';
import { PortfolioContent } from './types';

/**
 * English portfolio content.
 * Values starting with YOUR_ still need confirmation: they show as badges
 * while developing and are hidden from visitors. Remove optional fields or
 * list items you do not need: the interface adapts and hides empty sections.
 */
export const CONTENT_EN: PortfolioContent = {
  profile: {
    name: 'Hamza Lamin',
    title: 'Software Developer',
    location: 'Casablanca, Morocco',
    introduction:
      "I'm a software developer based in Casablanca, Morocco, working on enterprise applications and web platforms. My experience includes Java, Spring Boot, Angular, React, relational databases, automated testing, and CI/CD workflows. I enjoy building practical software solutions, from backend services and APIs to user-facing applications.",
    about: [],
    languages: [
      { name: 'Arabic', level: 'Native' },
      { name: 'Tamazight', level: 'Native' },
      { name: 'French', level: 'Intermediate' },
      { name: 'English', level: 'Intermediate' },
    ],
  },

  skills: [
    { name: 'Programming languages', skills: ['Java', 'C', 'PHP', 'JavaScript', 'TypeScript'] },
    { name: 'Backend development', skills: ['Spring Boot', 'Spring Framework', 'JEE', 'Hibernate', 'JPA', 'Laravel', 'SOAP', 'JAXB'] },
    { name: 'Frontend development', skills: ['Angular', 'React'] },
    { name: 'Testing', skills: ['JUnit 5', 'Mockito', 'Selenium', 'Test-driven development (TDD)'] },
    { name: 'Databases', skills: ['Oracle', 'PostgreSQL', 'MySQL', 'MongoDB'] },
    { name: 'Tools and infrastructure', skills: ['Git', 'Docker', 'Linux', 'Maven', 'Jira', 'Liquibase', 'Jenkins', 'GitLab'] },
    { name: 'Engineering practices', skills: ['Object-oriented programming (OOP)', 'Domain-driven design (DDD)', 'Design patterns', 'Agile', 'CI/CD'] },
  ],

  experience: [
    {
      id: 'eurafric-developer',
      role: 'Software Developer',
      organization: 'Eurafric Information',
      label: 'Eurafric · Developer',
      employment: 'Full-time (CDI)',
      period: { start: 'September 2025' },
      track: 'timeline',
      overview: 'Develop and maintain enterprise banking applications using Java, Spring Boot, Angular, Oracle and JEE.',
      responsibilities: [
        'Develop and maintain enterprise banking applications.',
        'Develop backend services and integrate them with Angular frontends.',
        'Work with Oracle databases and enterprise application environments.',
        'Collaborate with development, database and deployment teams.',
        'Contribute to testing, code quality and CI/CD processes.',
      ],
      technologies: ['Java', 'Spring Boot', 'Angular', 'Oracle', 'JEE', 'Jenkins', 'GitLab'],
    },
    {
      id: 'eurafric-intern',
      role: 'Software Developer Intern',
      organization: 'Eurafric Information',
      label: 'Eurafric · Intern',
      employment: 'Internship',
      period: { start: 'April 2025', end: 'July 2025' },
      track: 'timeline',
      context: 'Banking settlement system',
      overview: 'Contributed to the development of a banking settlement system for managing payments between banks.',
      responsibilities: [
        'Developed Spring Boot backend services.',
        'Developed Angular interfaces with multi-criteria search and dynamic data tables.',
        'Implemented JWT authentication and role-based access control.',
        'Contributed to user management and the administrator dashboard.',
        'Contributed to application containerization with Docker.',
      ],
      technologies: ['Java', 'Spring Boot', 'Angular', 'Oracle', 'JWT', 'Docker'],
    },
    {
      id: 'freelance',
      role: 'Freelance Software Developer',
      organization: 'Freelance',
      label: 'Freelance',
      employment: 'Multiple clients',
      period: null,
      track: 'parallel',
      overlaps: ['eurafric-intern', 'ecowatt-intern'],
      alongside: 'Alongside my studies and internships',
      scale: '3+ client projects',
      overview:
        'Alongside my studies and internships, I worked on more than three software projects for different clients. These projects involved different applications, technologies and client requirements. My involvement covered the software development lifecycle, from understanding client needs and initial project conception to implementation and deployment.',
      responsibilities: [
        'Communicate with clients to understand their requirements and objectives.',
        'Participate in project conception and technical planning.',
        'Translate business requirements into practical software solutions.',
        'Develop applications adapted to individual client needs.',
        'Work with different technologies depending on each project’s requirements.',
        'Adapt to different business contexts and technical constraints.',
        'Contribute throughout the development lifecycle, from conception to deployment.',
        'Balance freelance development work with my studies and internships.',
      ],
      technologiesNote: 'Different technologies depending on each project.',
      projects: [],
    },
    {
      id: 'ecowatt-intern',
      role: 'Full-Stack Developer Intern',
      organization: 'Ecowatt',
      label: 'Ecowatt · Intern',
      employment: 'Internship',
      period: { start: 'May 2024', end: 'July 2024' },
      track: 'timeline',
      overview: 'Contributed to web application development using Laravel, React.js and MySQL.',
      responsibilities: [
        'Developed backend functionality.',
        'Implemented database operations.',
        'Developed responsive frontend components with React.js.',
        'Contributed to full-stack application development.',
      ],
      technologies: ['Laravel', 'React.js', 'MySQL', 'PHP', 'JavaScript'],
    },
  ],

  projects: [
    {
      ...SHARED.projects.qatratHayat,
      name: 'Qatrat Hayat',
      category: 'Social impact · Blood donation platform',
      summary:
        'A platform designed to simplify and accelerate the connection between people who urgently need blood and potential blood donors, primarily in Morocco and the Arab world.',
      featured: true,
      period: 'YOUR_PROJECT_PERIOD',
      role: 'YOUR_PROJECT_ROLE',
      problem:
        'People facing urgent blood shortages often rely on social networks such as Facebook and Instagram to find donors. These general-purpose platforms are not designed for urgent blood requests, targeted donor notifications, location-based matching or efficient coordination. At the same time, many volunteers are willing to donate blood but lack a dedicated platform that helps them find relevant requests and act on them.',
      solution: 'Qatrat Hayat aims to provide a dedicated platform that connects people in need with potential donors through a more focused and intuitive experience.',
      objectives: [
        'Allow people to report blood needs.',
        'Allow potential donors to offer their help.',
        'Facilitate connections between people in need and nearby potential donors.',
        'Improve communication and coordination between users and administrators.',
        'Provide an experience adapted to urgent blood donation requests and the local context.',
      ],
      contribution: 'YOUR_PROJECT_CONTRIBUTION',
    },
    {
      ...SHARED.projects.apiStressLab,
      name: 'API Stress Lab',
      category: 'Java library · Developer tooling',
      summary: 'A Java library for API load testing, integrated with JUnit 5.',
      featured: true,
      features: [
        'Annotation-based configuration with @LoadTest and @EnableLoadTesting.',
        'Request-count-based and duration-based load tests.',
        'Configurable concurrency and timeouts.',
        'Throughput, response-time, success-rate and HTTP status-code statistics.',
      ],
    },
    {
      ...SHARED.projects.itlens,
      name: 'ITLens',
      category: 'Survey management application',
      summary: 'A survey management application with REST APIs built with Spring Boot and Spring Data JPA, and a dynamic Angular frontend.',
      implementation: [
        'REST APIs developed with Spring Boot and Spring Data JPA.',
        'Dynamic Angular frontend.',
        'Built following test-driven development principles.',
      ],
    },
  ],

  education: [
    { degree: 'Web Application Developer', institution: 'YouCode | UM6P', start: '2023', end: '2025' },
    { degree: 'Baccalaureate in Physical and Chemical Sciences', institution: 'Hassan Elkhayat High School', start: '2022', end: '2023' },
  ],

  certifications: [{ name: 'Oracle Certified Professional: Java SE 17 Developer', issuer: 'Oracle', date: '2025' }],

  contact: {
    email: SHARED.email,
    phone: SHARED.phone,
    location: 'Casablanca, Morocco',
    links: [
      { kind: 'github', label: 'GitHub', url: SHARED.links.github },
      { kind: 'linkedin', label: 'LinkedIn', url: SHARED.links.linkedin },
    ],
  },

  cv: { files: SHARED.cv },
};
