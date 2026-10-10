import { Plus } from 'lucide-react';
import type { BlockType } from '../../types/portfolio';
import { BLOCK_META, BLOCK_TYPES } from './blockMeta';

interface AddBlockMenuProps {
  onAdd: (type: BlockType) => void;
}

const AddBlockMenu = ({ onAdd }: AddBlockMenuProps) => (
  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-gray-300 p-3">
    <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 mr-1">
      <Plus size={16} /> Add block
    </span>
    {BLOCK_TYPES.map((type) => {
      const { label, icon: Icon } = BLOCK_META[type];
      return (
        <button
          key={type}
          type="button"
          onClick={() => onAdd(type)}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
        >
          <Icon size={15} /> {label}
        </button>
      );
    })}
  </div>
);

export default AddBlockMenu;
