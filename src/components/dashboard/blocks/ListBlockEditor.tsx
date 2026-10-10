import { useEffect, useRef } from 'react';
import { List, ListOrdered, Plus, X } from 'lucide-react';
import type { ListBlock } from '../../../types/portfolio';

interface ListBlockEditorProps {
  block: ListBlock;
  onChange: (block: ListBlock) => void;
}

const ListBlockEditor = ({ block, onChange }: ListBlockEditorProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const focusIndex = useRef<number | null>(null);

  // Move focus to a newly inserted item after it renders.
  useEffect(() => {
    if (focusIndex.current !== null) {
      inputRefs.current[focusIndex.current]?.focus();
      focusIndex.current = null;
    }
  }, [block.items.length]);

  const setItems = (items: string[]) => onChange({ ...block, items });

  const insertAfter = (index: number) => {
    const items = [...block.items];
    items.splice(index + 1, 0, '');
    focusIndex.current = index + 1;
    setItems(items);
  };

  const removeAt = (index: number) => {
    focusIndex.current = Math.max(index - 1, 0);
    setItems(block.items.filter((_, i) => i !== index));
  };

  const toggleClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
      active ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
    }`;

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg bg-gray-100 p-1">
        <button type="button" className={toggleClass(!block.ordered)} onClick={() => onChange({ ...block, ordered: false })}>
          <List size={16} /> Bulleted
        </button>
        <button type="button" className={toggleClass(block.ordered)} onClick={() => onChange({ ...block, ordered: true })}>
          <ListOrdered size={16} /> Numbered
        </button>
      </div>

      <ul className="space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right text-sm font-medium text-purple-600">
              {block.ordered ? `${i + 1}.` : '•'}
            </span>
            <input
              ref={(el) => (inputRefs.current[i] = el)}
              className="dash-input"
              value={item}
              placeholder="List item"
              onChange={(e) => setItems(block.items.map((v, j) => (j === i ? e.target.value : v)))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  insertAfter(i);
                } else if (e.key === 'Backspace' && item === '' && block.items.length > 1) {
                  e.preventDefault();
                  removeAt(i);
                }
              }}
            />
            <button
              type="button"
              className="btn-icon hover:text-red-600"
              onClick={() => removeAt(i)}
              disabled={block.items.length === 1}
              title="Remove item"
            >
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => insertAfter(block.items.length - 1)}
        className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800"
      >
        <Plus size={16} /> Add item
      </button>
    </div>
  );
};

export default ListBlockEditor;
