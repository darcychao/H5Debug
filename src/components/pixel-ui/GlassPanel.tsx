import React from 'react';
import './GlassPanel.css';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  blur?: number;
}

const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '', blur = 12 }) => {
  return (
    <div className={`glass-panel pixel-glass ${className}`} style={{ backdropFilter: `blur(${blur}px)` }}>
      {children}
    </div>
  );
};

export default GlassPanel;
