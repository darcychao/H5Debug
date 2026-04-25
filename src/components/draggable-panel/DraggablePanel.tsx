import React, { useRef, useState, useCallback } from 'react';
import './DraggablePanel.css';

interface DraggablePanelProps {
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  className?: string;
  onClose?: () => void;
  onCollapse?: () => void;
  collapsed?: boolean;
}

const DraggablePanel: React.FC<DraggablePanelProps> = ({
  title,
  children,
  defaultPosition = { x: 100, y: 100 },
  className = '',
  onClose,
  onCollapse,
  collapsed = false,
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.draggable-panel-controls')) return;
      e.preventDefault();
      setDragging(true);
      offsetRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        setPosition({
          x: moveEvent.clientX - offsetRef.current.x,
          y: moveEvent.clientY - offsetRef.current.y,
        });
      };

      const handleMouseUp = () => {
        setDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [position],
  );

  return (
    <div
      className={`draggable-panel glass-panel ${dragging ? 'draggable-panel--dragging' : ''} ${className}`}
      style={{ left: position.x, top: position.y }}
    >
      <div className="draggable-panel-header" onMouseDown={handleMouseDown}>
        <span className="draggable-panel-title">{title}</span>
        <div className="draggable-panel-controls">
          {onCollapse && (
            <button className="draggable-panel-btn" onClick={onCollapse}>
              {collapsed ? '+' : '-'}
            </button>
          )}
          {onClose && (
            <button className="draggable-panel-btn" onClick={onClose}>
              x
            </button>
          )}
        </div>
      </div>
      {!collapsed && <div className="draggable-panel-body">{children}</div>}
    </div>
  );
};

export default DraggablePanel;
