import React, { useCallback, useRef, useState } from 'react';
import './ResizableSplit.css';

interface ResizableSplitProps {
  children: [React.ReactNode, React.ReactNode];
  direction?: 'horizontal' | 'vertical';
  initialRatio?: number;
  minSize?: number;
  className?: string;
}

const ResizableSplit: React.FC<ResizableSplitProps> = ({
  children,
  direction = 'horizontal',
  initialRatio = 0.5,
  minSize = 100,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(initialRatio);
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newRatio: number;
      if (direction === 'horizontal') {
        newRatio = (moveEvent.clientX - rect.left) / rect.width;
      } else {
        newRatio = (moveEvent.clientY - rect.top) / rect.height;
      }
      const minRatio = minSize / (direction === 'horizontal' ? rect.width : rect.height);
      newRatio = Math.max(minRatio, Math.min(1 - minRatio, newRatio));
      setRatio(newRatio);
    };

    const handleMouseUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [direction, minSize]);

  return (
    <div
      ref={containerRef}
      className={`resizable-split resizable-split--${direction} ${dragging ? 'resizable-split--dragging' : ''} ${className}`}
    >
      <div className="resizable-split-pane" style={{ flex: ratio }}>
        {children[0]}
      </div>
      <div
        className={`resizable-split-handle resizable-split-handle--${direction}`}
        onMouseDown={handleMouseDown}
      />
      <div className="resizable-split-pane" style={{ flex: 1 - ratio }}>
        {children[1]}
      </div>
    </div>
  );
};

export default ResizableSplit;
