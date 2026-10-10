import { useState } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

/** Chip-style editor: type and press Enter or comma to add, × to remove. */
const TagInput = ({ label, tags, onChange, placeholder = 'Type and press Enter' }: TagInputProps) => {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const values = draft.split(',').map((v) => v.trim()).filter(Boolean);
    if (values.length) onChange([...tags, ...values.filter((v) => !tags.includes(v))]);
    setDraft('');
  };

  return (
    <div>
      <span className="dash-label">{label}</span>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-purple-50 py-1 pl-3 pr-1.5 text-sm text-purple-700">
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((_, j) => j !== i))}
              className="rounded-full p-0.5 hover:bg-purple-200"
              aria-label={`Remove ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          className="min-w-[10rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm focus:outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Backspace' && !draft && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default TagInput;
