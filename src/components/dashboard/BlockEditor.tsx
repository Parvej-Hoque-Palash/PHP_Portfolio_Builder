import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import type { Block } from '../../types/portfolio';
import { BLOCK_META } from './blockMeta';
import EmbedBlockEditor from './blocks/EmbedBlockEditor';
import ListBlockEditor from './blocks/ListBlockEditor';
import MediaBlockEditor from './blocks/MediaBlockEditor';
import TextBlockEditor from './blocks/TextBlockEditor';

interface BlockEditorProps {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  onChange: (block: Block) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}

function renderBody(block: Block, onChange: (block: Block) => void) {
  switch (block.type) {
    case 'text':
      return <TextBlockEditor block={block} onChange={onChange} />;
    case 'list':
      return <ListBlockEditor block={block} onChange={onChange} />;
    case 'media':
      return <MediaBlockEditor block={block} onChange={onChange} />;
    case 'embed':
      return <EmbedBlockEditor block={block} onChange={onChange} />;
  }
}

const BlockEditor = ({ block, isFirst, isLast, onChange, onMove, onRemove }: BlockEditorProps) => {
  const { label, icon: Icon } = BLOCK_META[block.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="group rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
          <Icon size={14} /> {label}
        </span>
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
          <button type="button" className="btn-icon" onClick={() => onMove(-1)} disabled={isFirst} title="Move up">
            <ArrowUp size={16} />
          </button>
          <button type="button" className="btn-icon" onClick={() => onMove(1)} disabled={isLast} title="Move down">
            <ArrowDown size={16} />
          </button>
          <button type="button" className="btn-icon hover:text-red-600" onClick={onRemove} title="Delete block">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {renderBody(block, onChange)}
    </motion.div>
  );
};

export default BlockEditor;
