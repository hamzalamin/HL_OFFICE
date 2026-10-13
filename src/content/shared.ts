/**
 * Language-independent values used by both en.ts and fr.ts.
 * Write each URL, address and slug once here.
 */
export const SHARED = {
  email: 'YOUR_EMAIL',
  phone: 'YOUR_PHONE',
  links: {
    github: 'YOUR_GITHUB_URL',
    linkedin: 'YOUR_LINKEDIN_URL',
  },
  projects: {
    one: { slug: 'project-one', repositoryUrl: 'YOUR_PROJECT_REPOSITORY_URL', demoUrl: 'YOUR_PROJECT_DEMO_URL' },
    two: { slug: 'project-two', repositoryUrl: 'YOUR_PROJECT_REPOSITORY_URL', demoUrl: 'YOUR_PROJECT_DEMO_URL' },
    three: { slug: 'project-three', repositoryUrl: 'YOUR_PROJECT_REPOSITORY_URL' },
  },
} as const;
