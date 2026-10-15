/**
 * Language-independent values used by both en.ts and fr.ts.
 * Write each URL, address and slug once here.
 */
export const SHARED = {
  email: 'hamzalamin80@gmail.com',
  phone: '+212 639 621 650',
  /** Named for whoever downloads them: name, title, CV. */
  cv: {
    en: 'cv/HamzaLamin_SoftwareDeveloper_CV.pdf',
    fr: 'cv/HamzaLamin_DeveloppeurLogiciel_CV.pdf',
  },
  links: {
    github: 'https://github.com/hamzalamin',
    linkedin: 'https://www.linkedin.com/in/hamza-lamin-a0440a296/',
  },
  projects: {
    // Repository, demo and dates still to be confirmed.
    qatratHayat: {
      slug: 'qatrat-hayat',
      nativeName: { text: 'قطرة حياة', lang: 'ar', dir: 'rtl' as const },
      repositoryUrl: 'YOUR_PROJECT_REPOSITORY_URL',
      demoUrl: 'YOUR_PROJECT_DEMO_URL',
      stack: ['Java', 'Spring Boot', 'Spring Security', 'JWT', 'React', 'PostgreSQL', 'Docker', 'JUnit', 'Liquibase'],
    },
    apiStressLab: {
      slug: 'api-stress-lab',
      period: '2026',
      repositoryUrl: 'https://github.com/hamzalamin/API-StressLab',
      documentationUrl: 'https://hamzalamin.github.io/api-stress-lab-docs/',
      stack: ['Java 17', 'Spring Boot', 'JUnit 5', 'Maven'],
    },
    itlens: {
      slug: 'itlens',
      period: '2024',
      repositoryUrl: 'https://github.com/hamzalamin/ITLens',
      stack: ['Java', 'Spring Boot', 'Spring Data JPA', 'Angular'],
    },
  },
};
