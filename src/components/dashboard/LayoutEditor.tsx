import { Reorder, useDragControls } from 'framer-motion';
import {
  BookOpen,
  Briefcase,
  Code2,
  FileText,
  FolderGit2,
  GraduationCap,
  GripVertical,
  Home,
  Layers,
  Mail,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { LayoutItem, PortfolioData } from '../../types/portfolio';
import type { PortfolioEditorActions } from '../../hooks/usePortfolioEditor';
import {
  STANDARD_PAGE_LABELS,
  canHide,
  isStandardPage,
  sectionIdOf,
  standardPageHasContent,
  type StandardPage,
} from '../../utils/layout';
import { publicSections } from '../../utils/portfolio';
import EditorCard from './fields/EditorCard';
import VisibilityToggle from './VisibilityToggle';

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

interface RowInfo {
  label: string;
  icon: LucideIcon;
  kind: string;
  /** False when the page would be left out of the menu anyway for having no content. */
  hasContent: boolean;
}

interface LayoutRowProps {
  item: LayoutItem;
  info: RowInfo;
  onVisibleChange: (visible: boolean) => void;
}

const LayoutRow = ({ item, info, onVisibleChange }: LayoutRowProps) => {
  // Drag only from the handle so the tick box stays clickable.
  const controls = useDragControls();
  const Icon = info.icon;
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      data-layout-id={item.id}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm"
      whileDrag={{ scale: 1.02, boxShadow: '0 10px 25px rgba(0,0,0,0.12)' }}
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
        title="Drag to reorder"
        aria-label={`Drag ${info.label}`}
      >
        <GripVertical size={18} />
      </button>
      <Icon size={18} className={item.visible ? 'shrink-0 text-purple-600' : 'shrink-0 text-gray-400'} />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-medium ${item.visible ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{info.label}</p>
        <p className="text-xs text-gray-500">
          {info.kind}
          {item.visible && !info.hasContent && ' · empty, not shown until it has content'}
        </p>
      </div>
      <VisibilityToggle visible={item.visible} label={info.label} disabled={!canHide(item.id)} onChange={onVisibleChange} />
    </Reorder.Item>
  );
};

interface LayoutEditorProps {
  data: PortfolioData;
  actions: PortfolioEditorActions;
}

/** Drag-and-drop order and show/hide for every page in the public menu. */
const LayoutEditor = ({ data, actions }: LayoutEditorProps) => {
  const shownSections = new Set(publicSections(data).map((s) => s.id));

  const infoFor = (id: string): RowInfo => {
    if (isStandardPage(id)) {
      return { label: STANDARD_PAGE_LABELS[id], icon: PAGE_ICONS[id], kind: 'Page', hasContent: standardPageHasContent(data, id) };
    }
    const sectionId = sectionIdOf(id);
    const section = data.sections.find((s) => s.id === sectionId);
    return {
      label: section?.title.trim() || 'Untitled section',
      icon: Layers,
      kind: 'Custom section',
      hasContent: sectionId !== null && shownSections.has(sectionId),
    };
  };

  return (
    <EditorCard
      title="Layout"
      description="Drag pages to change their order in your portfolio's menu. Untick a page to hide it from visitors without deleting its content."
    >
      <Reorder.Group axis="y" values={data.layout} onReorder={actions.setLayout} className="space-y-2">
        {data.layout.map((item) => (
          <LayoutRow key={item.id} item={item} info={infoFor(item.id)} onVisibleChange={(v) => actions.setVisible(item.id, v)} />
        ))}
      </Reorder.Group>
    </EditorCard>
  );
};

export default LayoutEditor;
