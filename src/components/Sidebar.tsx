import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  User,
  Code2,
  FolderGit2,
  BookOpen,
  Briefcase,
  GraduationCap,
  Mail,
  FileText,
  Layers,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import VisitorCounter from './VisitorCounter';
import { usePortfolio } from '../hooks/usePortfolio';
import { useIsOwnPortfolio } from '../hooks/useIsOwnPortfolio';
import { publicSections } from '../utils/portfolio';
import { STANDARD_PAGE_LABELS, isStandardPage, sectionIdOf, standardPageHasContent, type StandardPage } from '../utils/layout';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom hook to check media query
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

const PAGE_ICONS: Record<StandardPage, LucideIcon> = {
  home: Home,
  about: User,
  skills: Code2,
  projects: FolderGit2,
  research: BookOpen,
  experience: Briefcase,
  education: GraduationCap,
  contact: Mail,
  resume: FileText,
};

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { data, basePath, isDefault } = usePortfolio();
  const isOwnPortfolio = useIsOwnPortfolio();

  const { fullName, designation } = data.header;
  const sections = new Map(publicSections(data).map((s) => [s.id, s]));

  // In the order set in the dashboard's Layout tab, skipping hidden pages.
  // Standard pages are also skipped when empty; the default portfolio has a bundled resume.
  const menuItems: { path: string; icon: LucideIcon; label: string }[] = [];
  for (const { id, visible } of data.layout) {
    if (!visible) continue;
    if (isStandardPage(id)) {
      if (!standardPageHasContent(data, id, isDefault)) continue;
      menuItems.push({ path: id === 'home' ? basePath || '/' : `${basePath}/${id}`, icon: PAGE_ICONS[id], label: STANDARD_PAGE_LABELS[id] });
    } else {
      // Custom sections created in the dashboard
      const section = sections.get(sectionIdOf(id) ?? '');
      if (section) menuItems.push({ path: `${basePath}/section/${section.id}`, icon: Layers, label: section.title });
    }
  }
  // { path: '/research_interest', icon: Settings, label: 'Research Interest & Expertise' },
  // Only the signed-in owner of this portfolio sees the dashboard entry
  if (isOwnPortfolio) menuItems.push({ path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' });

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: isDesktop || isOpen ? 0 : -300 }}
      transition={{ type: 'spring', damping: 20 }}
      className={`fixed top-0 left-0 h-full w-[300px] bg-white shadow-xl z-40 transform transition-transform duration-100 ease-in-out ${
        isDesktop ? 'translate-x-0' : isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Scrollable Container */}
      <div className="h-full flex flex-col">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-6 text-center border-b border-gray-200"
        >
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold text-gray-800"
          >
            {fullName}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-purple-600 font-medium"
          >
            {designation}
          </motion.p>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-6">
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {menuItems.map((item) => (
              <motion.div key={item.path} variants={itemVariants}>
                <NavLink
                  to={item.path}
                  end={item.path === (basePath || '/')}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-700 hover:bg-purple-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="activeNavBackground"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          className="absolute inset-0 bg-purple-600 rounded-lg -z-10"
                        />
                      )}
                      <motion.span
                        whileHover={{ scale: 1.15, rotate: -6 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                        className="inline-flex"
                      >
                        <item.icon size={20} />
                      </motion.span>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </motion.div>
        </nav>
        {/* The counter key belongs to the default portfolio */}
        {isDefault && <VisitorCounter />}
      </div>
    </motion.aside>
  );
};

export default Sidebar;