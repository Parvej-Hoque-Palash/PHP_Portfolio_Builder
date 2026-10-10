import { Check } from 'lucide-react';
import { COLOR_OPTIONS } from '../../../utils/icons';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker = ({ value, onChange }: ColorPickerProps) => (
  <div>
    <span className="dash-label">Colour</span>
    <div className="flex flex-wrap gap-1.5">
      {COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          title={color.replace('bg-', '')}
          className={`${color} flex h-7 w-7 items-center justify-center rounded-full text-white ring-offset-2 transition ${
            value === color ? 'ring-2 ring-purple-400' : 'hover:scale-110'
          }`}
        >
          {value === color && <Check size={14} />}
        </button>
      ))}
    </div>
  </div>
);

export default ColorPicker;
