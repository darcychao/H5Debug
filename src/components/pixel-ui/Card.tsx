import React from 'react';
import './Card.css';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', headerActions }) => {
  return (
    <div className={`pixel-card ${className}`}>
      {(title || headerActions) && (
        <div className="pixel-card-header">
          {title && <h3 className="pixel-card-title">{title}</h3>}
          {headerActions && <div className="pixel-card-actions">{headerActions}</div>}
        </div>
      )}
      <div className="pixel-card-body">{children}</div>
    </div>
  );
};

export default Card;
