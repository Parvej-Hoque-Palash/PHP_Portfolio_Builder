import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutList, Plus, X } from 'lucide-react';
import type { PortfolioData } from '../../types/portfolio';
import type { PortfolioEditorActions } from '../../hooks/usePortfolioEditor';
import SectionCard from './SectionCard';
import { isPageVisible, sectionLayoutId } from '../../utils/layout';

const SUGGESTIONS = ['Certificates', 'Prescriptions', 'Documents', 'Publications', 'Awards'];

interface SectionManagerProps {
  data: PortfolioData;
  actions: PortfolioEditorActions;
}

const SectionManager = ({ data, actions }: SectionManagerProps) => {
  const { sections } = data;
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');

  const add = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    actions.addSection(trimmed);
    setTitle('');
    setIsAdding(false);
  };

  const existing = new Set(sections.map((s) => s.title.trim().toLowerCase()));
  const suggestions = SUGGESTIONS.filter((s) => !existing.has(s.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sections</h2>
          <p className="text-sm text-gray-500">Change where sections appear in the menu from the Layout tab.</p>
        </div>
        {!isAdding && (
          <button type="button" className="btn-primary" onClick={() => setIsAdding(true)}>
            <Plus size={18} /> Add Section
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              add(title);
            }}
            className="overflow-hidden"
          >
            <div className="dash-card space-y-4 border border-purple-100">
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="dash-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setIsAdding(false)}
                  placeholder="Section name, e.g. Certificates"
                />
                <button type="submit" className="btn-primary shrink-0" disabled={!title.trim()}>
                  Create
                </button>
                <button type="button" className="btn-icon shrink-0" onClick={() => setIsAdding(false)} title="Cancel">
                  <X size={18} />
                </button>
              </div>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-500">Quick add:</span>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => add(s)}
                      className="rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-700 transition-colors hover:bg-purple-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {sections.length === 0 && !isAdding && (
        <div className="dash-card flex flex-col items-center gap-3 py-12 text-center">
          <LayoutList size={40} className="text-purple-300" />
          <p className="text-gray-600">No sections yet. Add one to start building your portfolio.</p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            visible={isPageVisible(data, sectionLayoutId(section.id))}
            actions={actions}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SectionManager;
