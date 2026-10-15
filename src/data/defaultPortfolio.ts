import type { PortfolioData } from '../types/portfolio';
import { defaultLayout } from '../utils/layout';

/**
 * Built-in portfolio content. Used when no portfolio_config.json is published,
 * for any top-level key missing from it, and as the starting point the first
 * time the owner opens the dashboard. Item ids are fixed so they stay stable.
 *
 * This is placeholder content: sign in to /dashboard and replace it with your own.
 */
export const DEFAULT_PORTFOLIO: PortfolioData = {
  version: 2,
  header: {
    fullName: 'Your Name',
    designation: 'Your Role or Title',
    profilePhoto: null,
    resume: null,
  },

  home: {
    heading: 'Welcome to My Portfolio',
    tagline: 'A short line about what you do',
    highlights: [
      { id: 'hl-1', title: 'Web Development', icon: 'Code2', color: 'bg-blue-600' },
      { id: 'hl-2', title: 'Data Science', icon: 'BarChart3', color: 'bg-purple-600' },
      { id: 'hl-3', title: 'Machine Learning', icon: 'BrainCircuit', color: 'bg-indigo-500' },
      { id: 'hl-4', title: 'System Design', icon: 'Network', color: 'bg-green-500' },
    ],
  },

  about: {
    info: [
      { id: 'info-1', label: 'Name', value: 'Your Name', icon: 'User' },
      { id: 'info-2', label: 'Location', value: 'City, Country', icon: 'MapPin' },
      { id: 'info-3', label: 'Email', value: 'you@example.com', icon: 'Mail' },
    ],
    intro: [
      'Write a short introduction here: your background, studies and what you are working on now. Use **bold** to highlight key words.',
    ],
    more: [
      'Add more about your experience, the kind of problems you enjoy solving, and what you are looking for next.',
    ],
    ventures: [
      {
        id: 'venture-1',
        title: 'Side Project',
        description: 'A one-line description of something you are building.',
        icon: 'Rocket',
      },
    ],
    passionsIntro: 'Areas I am passionate about:',
    passions: ['Software Engineering', 'Data', 'Open Source'],
    closing: 'A closing sentence about how you like to work and how people can reach you.',
  },

  skills: [
    {
      id: 'skill-1',
      title: 'Programming Languages',
      icon: 'Code2',
      color: 'bg-blue-600',
      skills: ['Python', 'JavaScript', 'SQL'],
    },
    {
      id: 'skill-2',
      title: 'Frameworks & Tools',
      icon: 'Wrench',
      color: 'bg-green-600',
      skills: ['React', 'Node.js', 'Git'],
    },
    {
      id: 'skill-3',
      title: 'Languages',
      icon: 'Globe',
      color: 'bg-red-600',
      skills: ['English'],
    },
  ],

  projects: [
    {
      id: 'project-1',
      name: 'Sample Project',
      description: 'Describe what the project does and the technologies you used.',
      link: '',
      github: '',
    },
  ],

  research: [
    {
      id: 'research-1',
      title: 'Sample Research Title',
      authors: 'Your Name',
      supervisor: '',
      supervisorProfile: '',
      youtubeLink: '',
      kaggleLink: '',
      githubLink: '',
      paperLink: '',
      features: ['Key contribution'],
    },
  ],

  experience: [
    {
      id: 'exp-1',
      organisation: 'Company Name',
      role: 'Your Role',
      period: '2024 - Present',
      summary: ['What you worked on and the impact it had.'],
    },
  ],

  education: [
    {
      id: 'edu-1',
      degree: 'Your Degree',
      institution: 'Your University',
      location: 'City, Country',
      period: '2020 - 2024',
      description: '',
      achievements: [],
    },
  ],

  contact: {
    phone: '',
    email: 'you@example.com',
    location: 'City, Country',
    socials: [
      { id: 'social-1', label: 'GitHub', url: 'https://github.com/', icon: 'Github' },
      { id: 'social-2', label: 'LinkedIn', url: 'https://www.linkedin.com/', icon: 'Linkedin' },
    ],
    formspreeId: '',
  },

  sections: [],
  layout: defaultLayout(),
};
