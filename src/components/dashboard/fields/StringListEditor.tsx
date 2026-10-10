import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';

interface StringListEditorProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  hint?: string;
  /** Use textareas for long entries such as paragraphs. */
  multiline?: boolean;
}

/** An ordered list of strings with add / remove / reorder. */
const StringListEditor = ({ label, items, onChange, placeholder, addLabel = 'Add item', hint, multiline }: StringListEditorProps) => {
  const update = (index: number, value: string) => onChange(items.map((v, i) => (i === index ? value : v)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const move = (index: number, delta: -1 | 1) => {
    const next = [...items];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };

  return (
    <div>
      <span className="dash-label">{label}</span>
      {hint && <p className="-mt-0.5 mb-2 text-xs text-gray-500">{hint}</p>}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1">
            {multiline ? (
              <textarea
                rows={3}
                className="dash-input resize-y leading-relaxed"
                value={item}
                onChange={(e) => update(i, e.target.value)}
                placeholder={placeholder}
              />
            ) : (
              <input className="dash-input" value={item} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} />
            )}
            <div className={`flex shrink-0 ${multiline ? 'flex-col' : ''}`}>
              <button type="button" className="btn-icon" onClick={() => move(i, -1)} disabled={i === 0} title="Move up">
                <ArrowUp size={16} />
              </button>
              <button type="button" className="btn-icon" onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down">
                <ArrowDown size={16} />
              </button>
              <button type="button" className="btn-icon hover:text-red-600" onClick={() => remove(i)} title="Remove">
                <X size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800"
      >
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  );
};

export default StringListEditor;
