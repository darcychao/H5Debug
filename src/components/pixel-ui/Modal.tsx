import React, { useEffect, useRef } from 'react';
import './Modal.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, width = 480, footer }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="pixel-modal-overlay"
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="pixel-modal" style={{ width }}>
        <div className="pixel-modal-header">
          <h3 className="pixel-modal-title">{title}</h3>
          <button className="pixel-modal-close" onClick={onClose}>
            x
          </button>
        </div>
        <div className="pixel-modal-body">{children}</div>
        {footer && <div className="pixel-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
