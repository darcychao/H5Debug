import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useScreencastStore } from '../../stores/screencast.store';
import { useDeviceStore } from '../../stores/device.store';
import { screencastBridge } from '../../services/screencast-bridge';
import Button from '../../components/pixel-ui/Button';
import './ScreenView.css';

interface ScreenViewProps {
  deviceId: string | null;
}

const ScreenView: React.FC<ScreenViewProps> = ({ deviceId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { streaming, setStreaming, zoom, setZoom } = useScreencastStore();
  const [canvasSize, setCanvasSize] = useState({ width: 360, height: 640 });
  const [streamError, setStreamError] = useState<string | null>(null);
  const devices = useDeviceStore((s) => s.devices);

  // Get device info for initial canvas sizing
  const deviceInfo = deviceId ? devices.find((d) => `${d.type}:${d.id}` === deviceId) : null;
  const deviceWidth = deviceInfo?.screenWidth || 360;
  const deviceHeight = deviceInfo?.screenHeight || 640;

  // Keep streamingRef in sync — used by RAF loop which runs outside React's lifecycle
  const streamingRef = useRef(streaming);
  streamingRef.current = streaming;

  // Track visibility for debugging tab switch issues
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('[RAF] visibilitychange:', document.visibilityState, 'streaming=', streamingRef.current);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // RAF render loop - runs continuously, independent of React streaming state.
  // This prevents the placeholder from flashing over real content during tab switches.
  useEffect(() => {
    let rafId: number;
    let frameLogged = false;

    const renderLoop = () => {
      // Always read canvas fresh from ref
      const canvas = canvasRef.current;
      if (!canvas) {
        if (!frameLogged) console.log('[RAF] no canvas');
        rafId = requestAnimationFrame(renderLoop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (!frameLogged) console.log('[RAF] no ctx');
        rafId = requestAnimationFrame(renderLoop);
        return;
      }

      const frameData = screencastBridge.getLatestFrame();
      const { frameCount, drawnCount } = screencastBridge.getCounts();
      const isStreaming = streamingRef.current;
      frameLogged = false;

      // Log every 60 frames to track state during tab switches
      if (frameCount > 0 && frameCount % 60 === 0) {
        console.log(`[RAF] frames=${frameCount} drawn=${drawnCount} streaming=${isStreaming} hasData=${!!frameData} canvas=${canvas.width}x${canvas.height} vis=${document.visibilityState}`);
      }

      // Only show placeholder if we have no frame data at all AND no device or not streaming
      const hasFrameData = frameData && frameCount > 0;
      if (!hasFrameData) {
        canvas.width = deviceWidth;
        canvas.height = deviceHeight;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6a6a80';
        ctx.font = `${Math.round(canvas.height / 20)}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(
          !deviceId ? 'No device connected' : !isStreaming ? 'Click "Start" to stream' : 'Waiting for stream...',
          canvas.width / 2,
          canvas.height / 2,
        );
        rafId = requestAnimationFrame(renderLoop);
        return;
      }

      // Draw new frames
      if (frameCount > drawnCount) {
        const img = new Image();
        img.onload = () => {
          if (!img.complete || img.naturalWidth === 0) {
            if (!frameLogged) console.log('[RAF] img incomplete');
            return;
          }
          const currCanvas = canvasRef.current;
          if (!currCanvas) {
            if (!frameLogged) console.log('[RAF] currCanvas gone');
            return;
          }
          const currCtx = currCanvas.getContext('2d');
          if (!currCtx) {
            if (!frameLogged) console.log('[RAF] currCtx gone');
            return;
          }
          frameLogged = true;
          screencastBridge.markDrawn(frameCount);
          currCanvas.width = img.width;
          currCanvas.height = img.height;
          setCanvasSize({ width: img.width, height: img.height });
          currCtx.drawImage(img, 0, 0);
          if (!frameLogged) console.log(`[RAF] drew frame ${frameCount}, canvas=${currCanvas.width}x${currCanvas.height}`);
        };
        img.onerror = () => {
          if (!frameLogged) console.warn('[RAF] img load error, frameData len:', frameData.length);
        };
        img.src = `data:image/jpeg;base64,${frameData}`;
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, [deviceId, deviceWidth, deviceHeight]);

  const startScreencast = useCallback(async () => {
    if (!deviceId || !window.electronAPI) return;
    setStreamError(null);
    console.log('[ScreenView] startScreencast, deviceId=', deviceId, 'resolution:', deviceWidth, 'x', deviceHeight);
    try {
      await window.electronAPI.invoke('cdp:screencast:start', deviceId, {
        format: 'jpeg',
        quality: 80,
        maxWidth: Math.max(deviceWidth, deviceHeight),
        maxHeight: Math.min(deviceWidth, deviceHeight),
      });
      console.log('[ScreenView] startScreencast success');
      setStreaming(true);
      setStreamError(null);
    } catch (err: any) {
      console.error('[ScreenView] startScreencast failed:', err);
      const msg = err?.message || String(err);
      // Extract Chinese part of the error message if present
      const cnMatch = msg.match(/[\u4e00-\u9fa5].*?[\u4e00-\u9fa5]/);
      setStreamError(cnMatch ? cnMatch[0] : msg);
    }
  }, [deviceId, setStreaming, deviceWidth, deviceHeight]);

  const stopScreencast = useCallback(async () => {
    if (!deviceId || !window.electronAPI) return;
    try {
      await window.electronAPI.invoke('cdp:screencast:stop', deviceId);
      setStreaming(false);
      screencastBridge.reset();
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
      window.electronAPI.invoke('cdp:input:scroll', deviceId, x, y, e.deltaX, e.deltaY).catch(() => {});
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
        {streamError && (
          <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', marginLeft: 'auto' }}>
            {streamError}
          </span>
        )}
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
        {deviceInfo && (
          <span className="screen-zoom" style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
            {canvasSize.width}×{canvasSize.height}
          </span>
        )}
      </div>
      <div
        ref={wrapperRef}
        className="screen-canvas-wrapper"
        style={{ transform: `scale(${zoom})` }}
      >
        <canvas
          ref={canvasRef}
          className="screen-canvas"
          onClick={handleCanvasClick}
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
};

export default ScreenView;
