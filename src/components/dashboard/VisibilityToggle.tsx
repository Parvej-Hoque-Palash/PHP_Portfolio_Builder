import { Check } from 'lucide-react';

interface VisibilityToggleProps {
  visible: boolean;
  /** What is being shown or hidden, for the accessible name. */
  label: string;
  disabled?: boolean;
  onChange: (visible: boolean) => void;
}

/** "Visible" tick box: checked shows the page on the public portfolio, unchecked hides it. */
const VisibilityToggle = ({ visible, label, disabled, onChange }: VisibilityToggleProps) => (
  <label
    className={`inline-flex shrink-0 select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-purple-50'
    } ${visible ? 'text-purple-700' : 'text-gray-500'}`}
    title={disabled ? 'Always visible' : visible ? 'Visible — untick to hide' : 'Hidden — tick to show'}
  >
    <input
      type="checkbox"
      className="peer sr-only"
      checked={visible}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={`Show ${label}`}
    />
    <span
      className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-purple-400 ${
        visible ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300 bg-white'
      }`}
    >
      {visible && <Check size={14} strokeWidth={3} />}
    </span>
    {visible ? 'Visible' : 'Hidden'}
  </label>
);

export default VisibilityToggle;
