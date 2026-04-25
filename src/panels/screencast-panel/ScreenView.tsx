import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useCdpEvent } from '../../hooks/useCdpEvent';
import { useScreencastStore } from '../../stores/screencast.store';
import Button from '../../components/pixel-ui/Button';
import './ScreenView.css';

interface ScreenViewProps {
  deviceId: string | null;
}

const ScreenView: React.FC<ScreenViewProps> = ({ deviceId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { streaming, setStreaming, setFrameData, zoom, setZoom } = useScreencastStore();
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // Listen for screencast frames
  useCdpEvent('cdp:screencast:frame', (params: any) => {
    if (params?.params?.data) {
      setFrameData(params.params.data);
    }
  });

  // Render frames on canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!streaming || !deviceId) {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#6a6a80';
      ctx.font = '14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(deviceId ? 'Click "Start" to stream' : 'No device connected', canvas.width / 2, canvas.height / 2);
      return;
    }

    const frameData = useScreencastStore.getState().frameData;
    if (!frameData) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = `data:image/jpeg;base64,${frameData}`;
  }, [deviceId, streaming, useScreencastStore.getState().frameData]);

  const startScreencast = useCallback(async () => {
    if (!deviceId || !window.electronAPI) return;
    try {
      await window.electronAPI.invoke('cdp:screencast:start', deviceId, {
        format: 'jpeg',
        quality: 80,
        maxWidth: 720,
        maxHeight: 1280,
      });
      setStreaming(true);
    } catch (err) {
      console.error('Failed to start screencast:', err);
    }
  }, [deviceId, setStreaming]);

  const stopScreencast = useCallback(async () => {
    if (!deviceId || !window.electronAPI) return;
    try {
      await window.electronAPI.invoke('cdp:screencast:stop', deviceId);
      setStreaming(false);
    } catch (err) {
      console.error('Failed to stop screencast:', err);
    }
  }, [deviceId, setStreaming]);

  const takeScreenshot = useCallback(async () => {
    if (!deviceId || !window.electronAPI) return;
    try {
      const result = await window.electronAPI.invoke('cdp:console:evaluate', deviceId, 'document.title');
      console.log('Current page:', result);
    } catch (err) {
      console.error('Screenshot failed:', err);
    }
  }, [deviceId]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!deviceId || !window.electronAPI || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) * (canvasRef.current.width / rect.width));
      const y = Math.round((e.clientY - rect.top) * (canvasRef.current.height / rect.height));
      window.electronAPI.invoke('cdp:input:click', deviceId, x, y);
    },
    [deviceId],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      if (!deviceId || !window.electronAPI || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) * (canvasRef.current.width / rect.width));
      const y = Math.round((e.clientY - rect.top) * (canvasRef.current.height / rect.height));
      window.electronAPI.invoke('cdp:input:scroll', deviceId, x, y, e.deltaX, e.deltaY);
    },
    [deviceId],
  );

  return (
    <div className="screen-view">
      <div className="screen-controls">
        {!streaming ? (
          <Button size="sm" variant="primary" onClick={startScreencast} disabled={!deviceId}>
            Start
          </Button>
        ) : (
          <Button size="sm" variant="danger" onClick={stopScreencast}>
            Stop
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={takeScreenshot} disabled={!deviceId || !streaming}>
          Screenshot
        </Button>
        <span className="screen-zoom">
          Zoom: {Math.round(zoom * 100)}%
          <input
            type="range"
            min="0.25"
            max="2"
            step="0.25"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="zoom-slider"
          />
        </span>
      </div>
      <div className="screen-canvas-wrapper" style={{ transform: `scale(${zoom})` }}>
        <canvas
          ref={canvasRef}
          width={360}
          height={640}
          className="screen-canvas"
          onClick={handleCanvasClick}
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
};

export default ScreenView;
