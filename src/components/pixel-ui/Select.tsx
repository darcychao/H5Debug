import React from 'react';
import './Select.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  label?: string;
  onChange?: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({ options, label, onChange, className = '', ...props }) => {
  return (
    <div className={`pixel-select-wrapper ${className}`}>
      {label && <label className="pixel-select-label">{label}</label>}
      <select
        className="pixel-select"
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
