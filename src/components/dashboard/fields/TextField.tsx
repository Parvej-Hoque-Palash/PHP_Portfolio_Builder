import { useId } from 'react';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  type?: 'text' | 'url' | 'email' | 'tel';
}

const TextField = ({ label, value, onChange, placeholder, hint, multiline, rows = 3, type = 'text' }: TextFieldProps) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="dash-label">{label}</label>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          className="dash-input resize-y leading-relaxed"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          id={id}
          type={type}
          className="dash-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
};

export default TextField;
