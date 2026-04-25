import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`pixel-input-wrapper ${className}`}>
      {label && <label className="pixel-input-label">{label}</label>}
      <input className={`pixel-input ${error ? 'pixel-input--error' : ''}`} {...props} />
      {error && <span className="pixel-input-error">{error}</span>}
    </div>
  );
};

export default Input;
