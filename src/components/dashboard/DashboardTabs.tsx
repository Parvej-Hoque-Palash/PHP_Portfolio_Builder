import { motion } from 'framer-motion';
import {
  BookOpen,
  Briefcase,
  Code2,
  FileText,
  FolderGit2,
  GraduationCap,
  Home,
  Layers,
  ListOrdered,
  Mail,
  User,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';

export type DashboardTab =
  | 'profile'
  | 'layout'
  | 'home'
  | 'about'
  | 'skills'
  | 'projects'
  | 'research'
  | 'experience'
  | 'education'
  | 'contact'
  | 'resume'
  | 'sections';

const TABS: { id: DashboardTab; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'layout', label: 'Layout', icon: ListOrdered },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'about', label: 'About', icon: User },
  { id: 'skills', label: 'Skills', icon: Code2 },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'research', label: 'Research', icon: BookOpen },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'sections', label: 'Custom Sections', icon: Layers },
];

interface DashboardTabsProps {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}

const DashboardTabs = ({ active, onChange }: DashboardTabsProps) => (
  <nav className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0" aria-label="Dashboard sections">
    <div className="flex w-max gap-1 rounded-xl bg-white p-1.5 shadow">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
          className={`relative flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            active === id ? 'text-white' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
          }`}
        >
          {active === id && (
            <motion.span
              layoutId="dashboardActiveTab"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute inset-0 -z-0 rounded-lg bg-purple-600"
            />
          )}
          <Icon size={16} className="relative" />
          <span className="relative">{label}</span>
        </button>
      ))}
    </div>
  </nav>
);

export default DashboardTabs;
