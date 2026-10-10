import type { PortfolioData } from '../types/portfolio';
import { defaultLayout } from '../utils/layout';

/**
 * Built-in portfolio content. Used when no portfolio_config.json is published,
 * for any top-level key missing from it, and as the starting point the first
 * time the owner opens the dashboard. Item ids are fixed so they stay stable.
 */
export const DEFAULT_PORTFOLIO: PortfolioData = {
  version: 2,
  header: {
    fullName: 'Md. Parvej Hoque Palash',
    designation: 'Data & AI Researcher',
    profilePhoto: null,
    resume: null,
  },

  home: {
    heading: 'Welcome to My Portfolio',
    tagline: 'Turning ideas into reality through creativity',
    highlights: [
      { id: 'hl-1', title: 'Health Care AI', icon: 'Stethoscope', color: 'bg-teal-600' },
      { id: 'hl-2', title: 'Artificial Intelligence', icon: 'Cpu', color: 'bg-purple-600' },
      { id: 'hl-3', title: 'Machine Learning', icon: 'BrainCircuit', color: 'bg-indigo-500' },
      { id: 'hl-4', title: 'Deep Learning', icon: 'BrainCog', color: 'bg-pink-500' },
      { id: 'hl-5', title: 'Data Engineering', icon: 'Database', color: 'bg-sky-600' },
      { id: 'hl-6', title: 'Data Science', icon: 'BarChart3', color: 'bg-blue-600' },
      { id: 'hl-7', title: 'System Design', icon: 'Network', color: 'bg-green-500' },
      { id: 'hl-8', title: 'Business Intelligence', icon: 'PieChart', color: 'bg-orange-500' },
    ],
  },

  about: {
    info: [
      { id: 'info-1', label: 'Name', value: 'Md. Parvej Hoque Palash', icon: 'User' },
      { id: 'info-2', label: 'Date of Birth', value: '22nd March, 2001', icon: 'Calendar' },
      { id: 'info-3', label: 'Location', value: '180/1, Jambari, Elashpur, Cumilla-3500', icon: 'MapPin' },
      { id: 'info-4', label: 'Nationality', value: 'Bangladeshi', icon: 'Flag' },
      { id: 'info-5', label: 'Email', value: 'mdparvejhoquepalash.official@gmail.com', icon: 'Mail' },
    ],
    intro: [
      'I am a postgraduate in **Computer Science and Engineering (CSE)**, having completed both my **B.Sc.** and **M.Sc.** from **Jahangirnagar University (JU)**.',
      'Currently, I work as a **Software Engineer at Divine IT Limited**, where I develop data-driven applications and enterprise solutions using technologies such as **Python, Django, Next.js, React, Node.js, PostgreSQL, MySQL, MongoDB**, and **SQLAlchemy**. My work spans backend development, database design, reporting systems, and business analytics solutions, enabling organizations to make informed, data-driven decisions.',
    ],
    more: [
      'I have hands-on experience in designing scalable databases, optimizing SQL queries, automating reports, and building business intelligence dashboards using **SQL, PostgreSQL, Power BI**, and modern data processing techniques. I enjoy translating complex business requirements into efficient data models, reporting systems, and decision-support tools that improve operational efficiency.',
      'My key contributions include working on **prismERP**, a comprehensive enterprise resource planning platform where I developed scalable features, reporting modules, and data-centric solutions for diverse business operations.',
      'Beyond my professional role, I am actively pursuing entrepreneurship through two impactful startup projects:',
    ],
    ventures: [
      {
        id: 'venture-1',
        title: 'Genomedics',
        description: 'A responsive web platform for a leading medicine supplier in Bangladesh.',
        icon: 'Microscope',
      },
      {
        id: 'venture-2',
        title: 'Albab Academy',
        description:
          'A comprehensive school management system featuring online admissions, automated payments, academic reporting, and administrative automation.',
        icon: 'School',
      },
    ],
    passionsIntro:
      'I am passionate about building scalable data pipelines, developing intelligent systems, and leveraging data to solve real-world problems:',
    passions: ['Data Engineering', 'Data Analytics', 'Machine Learning', 'Artificial Intelligence'],
    closing:
      'With a strong foundation in software engineering and data technologies, I enjoy collaborating with stakeholders, transforming raw data into actionable insights, and delivering reliable, scalable, and user-centric solutions that create measurable business value.',
  },

  skills: [
    {
      id: 'skill-1',
      title: 'Programming Languages',
      icon: 'Code2',
      color: 'bg-blue-600',
      skills: ['Python', 'SQL', 'JavaScript', 'C', 'C++', 'HTML', 'CSS'],
    },
    {
      id: 'skill-2',
      title: 'Data & Analytics',
      icon: 'BarChart3',
      color: 'bg-orange-600',
      skills: [
        'PostgreSQL', 'MySQL', 'Redshift', 'SQLAlchemy', 'Pandas', 'Power BI',
        'Data Modeling', 'Query Optimization', 'Reporting & Dashboards',
        'Business Intelligence & KPI Reporting', 'Data Visualization',
      ],
    },
    {
      id: 'skill-3',
      title: 'Frameworks & Databases',
      icon: 'Server',
      color: 'bg-green-600',
      skills: ['Django', 'React', 'Node.js', 'Express.js', 'Next.js', 'PostgreSQL', 'MySQL', 'MongoDB'],
    },
    {
      id: 'skill-4',
      title: 'Technologies & Tools',
      icon: 'Wrench',
      color: 'bg-purple-600',
      skills: [
        'REST API', 'Eclipse (BIRT Reporting)', 'GitHub', 'Postman',
        'Linux Environment', 'Figma', 'Cloudflare', 'Vercel', 'Netlify',
      ],
    },
    {
      id: 'skill-5',
      title: 'Languages',
      icon: 'Globe',
      color: 'bg-red-600',
      skills: ['English (Fluent)', 'Bengali (Native)'],
    },
  ],

  projects: [
    {
      id: 'project-1',
      name: 'Genomedics',
      description: 'A dynamic, responsive website for a leading medicine supplier in Bangladesh.',
      link: 'https://genomedics.com.bd/',
      github: 'https://github.com/GENO-MEDICS/GenoMedic',
    },
    {
      id: 'project-2',
      name: 'Albab Academy',
      description:
        'A comprehensive school automation system featuring online admissions, payment automation, and detailed report generation.',
      link: 'https://albab-academy.com/',
      github: 'https://github.com/albaba-academy/albaba-academy',
    },
    {
      id: 'project-3',
      name: 'Library Management',
      description: 'Developed an admin dashboard to visualize book statistics across various categories.',
      link: '',
      github: 'https://github.com/Parvej-Hoque-Palash/Bandarban-Library',
    },
    {
      id: 'project-4',
      name: 'Employee Management',
      description:
        'A web-based employee management system allowing unauthorized users to view data while registered users can view, update, and delete records in the database.',
      link: 'https://emp980.netlify.app/',
      github: 'https://github.com/Parvej-Hoque-Palash/Employee-Management-System',
    },
    {
      id: 'project-5',
      name: 'Konta Niben',
      description:
        'An e-commerce web application for cosmetics items, followed Agile SDLC methodology, completing two sprints while collaborating via GitHub Wiki, Discord, and Trello.',
      link: '',
      github: 'https://github.com/SQA-PROJECT-1/Konta-Niben',
    },
  ],

  research: [
    {
      id: 'research-1',
      title:
        'Ensemble Feature Selection and Harris Hawks Optimization for Explainable Mental Health Risk Prediction in Female Sex Workers',
      authors:
        'Ahnaf Atef Choudhury, Md. Parvej Hoque Palash, Shahriar Siddique Ayon, Ramkrishna Saha, Abdullah Al Mamun',
      supervisor: '',
      supervisorProfile: '',
      youtubeLink: '',
      kaggleLink: '',
      githubLink: '',
      paperLink:
        'https://www.researchgate.net/publication/407645883_Ensemble_Feature_Selection_and_Harris_Hawks_Optimization_for_Explainable_Mental_Health_Risk_Prediction_in_Female_Sex_Workers',
      features: ['Mental Health Risk Prediction'],
    },
    {
      id: 'research-2',
      title: 'A Deep Learning Approach For Parkinson Disease Progression Forecasting',
      authors: 'Md. Parvej Hoque Palash',
      supervisor: 'Dr. Liton Jude Rozario, Professor, Department of CSE, JU',
      supervisorProfile: 'https://www.juniv.edu/teachers/litonrozario',
      youtubeLink: '',
      kaggleLink: 'https://www.kaggle.com/code/parvejhoque/ntua-test-01/edit/run/252909876',
      githubLink: 'https://github.com/Parvej-Hoque-Palash/DDoS-Attack-Detection-using-ML',
      paperLink: '',
      features: ['Classification of Parkinson Disease'],
    },
    {
      id: 'research-3',
      title: 'DDoS Attack Detection Using Machine Learning',
      authors: 'Md. Parvej Hoque Palash',
      supervisor: 'Bulbul Ahammad, Assistant Professor, Department of CSE, JU',
      supervisorProfile: 'https://www.juniv.edu/teachers/bulbul',
      youtubeLink: '',
      kaggleLink: '',
      githubLink: 'https://github.com/Parvej-Hoque-Palash/DDoS-Attack-Detection-using-ML',
      paperLink: '',
      features: ['Detection & Classification of DDoS Attack'],
    },
    {
      id: 'research-4',
      title: 'Cyber Bullying Detection on Social Media Platform using NLP',
      authors: 'Md. Parvej Hoque Palash',
      supervisor: '',
      supervisorProfile: '',
      youtubeLink: '',
      kaggleLink: '',
      githubLink: '',
      paperLink: '',
      features: ['Detection & Classification of Cyber Bullying'],
    },
  ],

  experience: [
    {
      id: 'exp-1',
      organisation: 'Divine IT Limited',
      role: 'Software Engineer',
      period: 'April 2025 - Present',
      summary: [
        'Implemented a SearchSession module that shortens URLs by storing a large number of parameters in a table under a session key and using that session key in the URL.',
        'Implemented array support for receiver in Banglalink’s SMS Integration.',
        'Developed and maintained enterprise applications, reporting systems, and data-driven solutions using Python, SQLAlchemy, PostgreSQL, and JavaScript.',
        'Designed and generated business reports, regulatory reports, KPI dashboards, and visualization components to support operational monitoring and strategic decision-making.',
        'Built and optimized complex SQL queries and database structures to improve reporting performance, data accuracy, and system efficiency.',
        'Developed VAT calculation modules, Mushak reports, and analytics dashboards within PrismVAT, enabling automated compliance reporting and business performance tracking.',
        'Designed and implemented an Auction (Bidding) Module in PrismERP, providing real-time monitoring, workflow automation, sales tracking, and operational reporting capabilities.',
        'Enhanced third-party integrations and notification services while improving application scalability and data flow reliability.',
      ],
    },
    {
      id: 'exp-2',
      organisation: 'Divine IT Limited',
      role: 'Trainee Software Engineer',
      period: 'July 2024 - March 2025',
      summary: [
        'Created a SQL Query Builder Editor using React and Redux, enabling users to generate dynamic queries and perform data analysis efficiently.',
        'Learned and worked with Furinapy, a Python-based framework, on the PrismERP project.',
        'Designed, optimized, and refactored over 1,000 SQLAlchemy queries during migration from MySQL to PostgreSQL, improving query performance, maintainability, and reporting efficiency.',
        'Implemented a portlet page with a sidebar to display a list of portlets on the left and each portlet on the right.',
        'Implemented user-wise portlet URL access in the list of portlets.',
        'Implemented dashboard management and data access features, including configurable reporting components, session-based search management, and role-based access control.',
        'Performed query tuning, testing, debugging, and performance optimization to ensure reliable reporting and accurate business data delivery.',
      ],
    },
  ],

  education: [
    {
      id: 'edu-1',
      degree: 'Master of Science in Computer Science and Engineering',
      institution: 'Jahangirnagar University',
      location: 'Dhaka, Bangladesh',
      period: '2024 - 2025',
      description: '',
      achievements: [],
    },
    {
      id: 'edu-2',
      degree: 'Bachelor of Science in Computer Science and Engineering',
      institution: 'Jahangirnagar University',
      location: 'Dhaka, Bangladesh',
      period: '2019 - 2024',
      description: '',
      achievements: [],
    },
    {
      id: 'edu-3',
      degree: 'HSC',
      institution: 'Cumilla Victoria Govt. College',
      location: 'Cumilla, Chattogram, Bangladesh',
      period: '2016 - 2018',
      description: '',
      achievements: [],
    },
    {
      id: 'edu-4',
      degree: 'SSC',
      institution: 'Cumilla Modern High School',
      location: 'Cumilla, Chattogram, Bangladesh',
      period: '2014 - 2016',
      description: '',
      achievements: [],
    },
  ],

  contact: {
    phone: '+8801841763871',
    email: 'mdparvejhoquepalash.official@gmail.com',
    location: 'Bangladesh',
    socials: [
      { id: 'social-1', label: 'GitHub', url: 'https://github.com/Parvej-Hoque-Palash', icon: 'Github' },
      { id: 'social-2', label: 'LinkedIn', url: 'https://www.linkedin.com/in/parvej-hoque-palash/', icon: 'Linkedin' },
      { id: 'social-3', label: 'YouTube', url: 'https://www.youtube.com/@parvejhoquepalash3842', icon: 'Youtube' },
    ],
    formspreeId: 'meoalevz',
  },

  sections: [],
  layout: defaultLayout(),
};
