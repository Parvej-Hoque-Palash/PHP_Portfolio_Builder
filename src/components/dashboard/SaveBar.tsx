import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Send } from 'lucide-react';

interface SaveBarProps {
  isDirty: boolean;
  isSaving: boolean;
  canSave: boolean;
  error: string | null;
  lastSavedAt: Date | null;
  onSave: () => void;
  onDiscard: () => void;
}

const SaveBar = ({ isDirty, isSaving, canSave, error, lastSavedAt, onSave, onDiscard }: SaveBarProps) => {
  let status;
  if (error) {
    status = (
      <span className="inline-flex items-center gap-1.5 text-red-600">
        <AlertCircle size={16} className="shrink-0" /> <span className="truncate">{error}</span>
      </span>
    );
  } else if (isDirty) {
    status = (
      <span className="inline-flex items-center gap-1.5 text-amber-600">
        <span className="h-2 w-2 rounded-full bg-amber-500" /> Unsaved changes
      </span>
    );
  } else if (lastSavedAt) {
    status = (
      <span className="inline-flex items-center gap-1.5 text-green-600">
        <CheckCircle2 size={16} /> Saved to Drive and published at {lastSavedAt.toLocaleTimeString()}
      </span>
    );
  } else {
    status = <span className="text-gray-500">All changes saved</span>;
  }

  return (
    <div className="sticky top-16 md:top-4 z-30">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white/90 px-4 py-3 shadow-lg ring-1 ring-gray-100 backdrop-blur">
        <div className="flex-1 min-w-0 text-sm">{status}</div>
        <AnimatePresence>
          {isDirty && !isSaving && (
            <motion.button
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              type="button"
              onClick={() => window.confirm('Discard all unsaved changes?') && onDiscard()}
              className="btn-icon"
              title="Discard changes"
            >
              <RotateCcw size={18} />
            </motion.button>
          )}
        </AnimatePresence>
        <button type="button" className="btn-primary" onClick={onSave} disabled={!isDirty || isSaving || !canSave}>
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {isSaving ? 'Publishing…' : 'Save & Publish'}
        </button>
      </div>
    </div>
  );
};

export default SaveBar;
