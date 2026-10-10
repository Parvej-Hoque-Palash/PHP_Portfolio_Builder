import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from 'lucide-react';

interface RepeatableListProps<T extends { id: string }> {
  items: T[];
  onChange: (items: T[]) => void;
  createItem: () => T;
  /** Heading shown on each item's collapsed row. */
  itemTitle: (item: T, index: number) => string;
  renderItem: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
  addLabel: string;
  emptyText?: string;
}

/** A reorderable list of collapsible cards, each editing one object. */
function RepeatableList<T extends { id: string }>({
  items,
  onChange,
  createItem,
  itemTitle,
  renderItem,
  addLabel,
  emptyText = 'Nothing here yet.',
}: RepeatableListProps<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const update = (id: string, patch: Partial<T>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const move = (index: number, delta: -1 | 1) => {
    const next = [...items];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };

  const remove = (item: T, index: number) => {
    if (window.confirm(`Delete "${itemTitle(item, index)}"?`)) onChange(items.filter((i) => i.id !== item.id));
  };

  const add = () => {
    const item = createItem();
    onChange([...items, item]);
    setExpanded((prev) => new Set(prev).add(item.id));
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-gray-500">{emptyText}</p>}

      {items.map((item, i) => {
        const isOpen = expanded.has(item.id);
        return (
          <div key={item.id} className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-1 px-3 py-2">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="flex flex-1 min-w-0 items-center gap-2 py-1 text-left"
                aria-expanded={isOpen}
              >
                <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                <span className="truncate font-medium text-gray-800">{itemTitle(item, i)}</span>
              </button>
              <button type="button" className="btn-icon" onClick={() => move(i, -1)} disabled={i === 0} title="Move up">
                <ArrowUp size={16} />
              </button>
              <button type="button" className="btn-icon" onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down">
                <ArrowDown size={16} />
              </button>
              <button type="button" className="btn-icon hover:text-red-600" onClick={() => remove(item, i)} title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 border-t border-gray-100 p-4">{renderItem(item, (patch) => update(item.id, patch))}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <button type="button" className="btn-secondary" onClick={add}>
        <Plus size={18} /> {addLabel}
      </button>
    </div>
  );
}

export default RepeatableList;
