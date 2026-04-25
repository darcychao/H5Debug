import React from 'react';
import './Toggle.css';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled = false }) => {
  return (
    <label className={`pixel-toggle ${disabled ? 'pixel-toggle--disabled' : ''}`}>
      <div className="pixel-toggle-track" onClick={() => !disabled && onChange(!checked)}>
        <div className={`pixel-toggle-thumb ${checked ? 'pixel-toggle-thumb--on' : ''}`} />
      </div>
      {label && <span className="pixel-toggle-label">{label}</span>}
    </label>
  );
};

export default Toggle;
