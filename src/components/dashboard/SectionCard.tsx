import { AnimatePresence, motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { Section } from '../../types/portfolio';
import type { PortfolioEditorActions } from '../../hooks/usePortfolioEditor';
import AddBlockMenu from './AddBlockMenu';
import BlockEditor from './BlockEditor';
import VisibilityToggle from './VisibilityToggle';
import { sectionLayoutId } from '../../utils/layout';

interface SectionCardProps {
  section: Section;
  visible: boolean;
  actions: PortfolioEditorActions;
}

const SectionCard = ({ section, visible, actions }: SectionCardProps) => {
  const handleRemove = () => {
    const label = section.title.trim() || 'this section';
    if (section.blocks.length === 0 || window.confirm(`Delete "${label}" and all of its blocks?`)) {
      actions.removeSection(section.id);
    }
  };

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="dash-card"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 self-stretch rounded-full bg-gradient-to-b from-purple-500 to-blue-500" />
        <input
          className="flex-1 min-w-0 bg-transparent text-xl font-semibold text-gray-800 placeholder-gray-400 border-b border-transparent px-1 py-1 focus:border-purple-300 focus:outline-none"
          value={section.title}
          onChange={(e) => actions.renameSection(section.id, e.target.value)}
          placeholder="Section title"
          aria-label="Section title"
        />
        <VisibilityToggle
          visible={visible}
          label={section.title.trim() || 'section'}
          onChange={(v) => actions.setVisible(sectionLayoutId(section.id), v)}
        />
        <button type="button" className="btn-icon hover:text-red-600" onClick={handleRemove} title="Delete section">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {section.blocks.map((block, i) => (
            <BlockEditor
              key={block.id}
              block={block}
              isFirst={i === 0}
              isLast={i === section.blocks.length - 1}
              onChange={(b) => actions.updateBlock(section.id, b)}
              onMove={(delta) => actions.moveBlock(section.id, block.id, delta)}
              onRemove={() => actions.removeBlock(section.id, block.id)}
            />
          ))}
        </AnimatePresence>
        <AddBlockMenu onAdd={(type) => actions.addBlock(section.id, type)} />
      </div>
    </motion.section>
  );
};

export default SectionCard;
