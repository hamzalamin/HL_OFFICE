import { SHARED } from './shared';
import { PortfolioContent } from './types';

/**
 * French portfolio content (contenu en français).
 * Replace every value that starts with YOUR_. Remove optional fields or list
 * items you do not need: the interface adapts and hides empty sections.
 */
export const CONTENT_FR: PortfolioContent = {
  profile: {
    name: 'YOUR_NAME',
    title: 'YOUR_PROFESSIONAL_TITLE',
    location: 'YOUR_LOCATION',
    introduction: 'YOUR_INTRODUCTION',
    about: ['YOUR_ABOUT_PARAGRAPH'],
    availability: 'YOUR_AVAILABILITY',
  },

  skills: [
    { name: 'YOUR_SKILL_GROUP', skills: ['YOUR_SKILL', 'YOUR_SKILL', 'YOUR_SKILL'] },
    { name: 'YOUR_SKILL_GROUP', skills: ['YOUR_SKILL', 'YOUR_SKILL'] },
  ],

  experience: [
    {
      role: 'YOUR_ROLE',
      organization: 'YOUR_ORGANIZATION',
      location: 'YOUR_LOCATION',
      start: 'YOUR_START_DATE',
      summary: 'YOUR_EXPERIENCE_SUMMARY',
      highlights: ['YOUR_EXPERIENCE_HIGHLIGHT'],
      technologies: ['YOUR_TECHNOLOGY'],
    },
  ],

  projects: [
    {
      ...SHARED.projects.one,
      name: 'YOUR_PROJECT_NAME',
      summary: 'YOUR_PROJECT_SUMMARY',
      featured: true,
      period: 'YOUR_PROJECT_PERIOD',
      role: 'YOUR_PROJECT_ROLE',
      problem: 'YOUR_PROJECT_PROBLEM',
      features: ['YOUR_PROJECT_FEATURE', 'YOUR_PROJECT_FEATURE'],
      contribution: 'YOUR_PROJECT_CONTRIBUTION',
      stack: ['YOUR_TECHNOLOGY', 'YOUR_TECHNOLOGY'],
      implementation: ['YOUR_PROJECT_IMPLEMENTATION'],
      decisions: [{ title: 'YOUR_DECISION_TITLE', context: 'YOUR_DECISION_CONTEXT', decision: 'YOUR_DECISION', tradeoffs: 'YOUR_DECISION_TRADEOFFS' }],
      challenges: [{ challenge: 'YOUR_CHALLENGE', solution: 'YOUR_SOLUTION' }],
      results: ['YOUR_VERIFIED_RESULT'],
      lessons: ['YOUR_LESSON_LEARNED'],
      improvements: ['YOUR_POSSIBLE_IMPROVEMENT'],
    },
    {
      ...SHARED.projects.two,
      name: 'YOUR_PROJECT_NAME',
      summary: 'YOUR_PROJECT_SUMMARY',
      featured: true,
      problem: 'YOUR_PROJECT_PROBLEM',
      stack: ['YOUR_TECHNOLOGY'],
    },
    {
      ...SHARED.projects.three,
      name: 'YOUR_PROJECT_NAME',
      summary: 'YOUR_PROJECT_SUMMARY',
    },
  ],

  education: [
    { degree: 'YOUR_DEGREE', institution: 'YOUR_INSTITUTION', start: 'YOUR_START_DATE', end: 'YOUR_END_DATE', description: 'YOUR_EDUCATION_DESCRIPTION' },
  ],

  certifications: [{ name: 'YOUR_CERTIFICATION', issuer: 'YOUR_CERTIFICATION_ISSUER', date: 'YOUR_CERTIFICATION_DATE' }],

  contact: {
    email: SHARED.email,
    phone: SHARED.phone,
    location: 'YOUR_LOCATION',
    message: 'YOUR_CONTACT_MESSAGE',
    links: [
      { kind: 'github', label: 'GitHub', url: SHARED.links.github },
      { kind: 'linkedin', label: 'LinkedIn', url: SHARED.links.linkedin },
    ],
  },

  cv: {
    // file: 'cv/cv-fr.pdf',
    updated: 'YOUR_CV_UPDATE_DATE',
  },
};
