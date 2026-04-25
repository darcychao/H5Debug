import React, { useCallback, useRef } from 'react';

interface TouchOverlayProps {
  deviceId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  onCoordinateSelect?: (x: number, y: number) => void;
}

const TouchOverlay: React.FC<TouchOverlayProps> = ({
  deviceId,
  canvasWidth,
  canvasHeight,
  onCoordinateSelect,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!deviceId || !window.electronAPI) return;
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.round((e.clientX - rect.left) * (canvasWidth / rect.width));
      const y = Math.round((e.clientY - rect.top) * (canvasHeight / rect.height));

      onCoordinateSelect?.(x, y);
      window.electronAPI.invoke('cdp:input:click', deviceId, x, y);
    },
    [deviceId, canvasWidth, canvasHeight, onCoordinateSelect],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!deviceId || !window.electronAPI) return;
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.round((e.clientX - rect.left) * (canvasWidth / rect.width));
      const y = Math.round((e.clientY - rect.top) * (canvasHeight / rect.height));

      window.electronAPI.invoke('cdp:input:scroll', deviceId, x, y, e.deltaX, e.deltaY);
    },
    [deviceId, canvasWidth, canvasHeight],
  );

  return (
    <div
      ref={overlayRef}
      className="touch-overlay"
      onClick={handleClick}
      onWheel={handleWheel}
      style={{ width: canvasWidth, height: canvasHeight }}
    />
  );
};

export default TouchOverlay;
