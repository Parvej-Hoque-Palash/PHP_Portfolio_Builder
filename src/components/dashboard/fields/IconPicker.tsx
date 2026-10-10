import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ICON_NAMES, ICONS, getIcon } from '../../../utils/icons';

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
  label?: string;
}

const IconPicker = ({ value, onChange, label = 'Icon' }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Current = getIcon(value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <span className="dash-label">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 hover:border-purple-300"
        aria-expanded={open}
      >
        <Current size={18} className="text-purple-600" />
        <span className="text-sm">{ICONS[value] ? value : 'Choose'}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 grid w-72 grid-cols-6 gap-1 rounded-lg border border-gray-100 bg-white p-2 shadow-xl">
          {ICON_NAMES.map((name) => {
            const Icon = ICONS[name];
            return (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={`flex items-center justify-center rounded-md p-2 transition-colors ${
                  name === value ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IconPicker;
