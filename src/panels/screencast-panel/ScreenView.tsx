import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useCdpEvent } from '../../hooks/useCdpEvent';
import { useScreencastStore } from '../../stores/screencast.store';
import { useDeviceStore } from '../../stores/device.store';
import Button from '../../components/pixel-ui/Button';
import './ScreenView.css';

interface ScreenViewProps {
  deviceId: string | null;
}

const ScreenView: React.FC<ScreenViewProps> = ({ deviceId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { streaming, setStreaming, setFrameData, zoom, setZoom } = useScreencastStore();
  const [canvasSize, setCanvasSize] = useState({ width: 360, height: 640 });
  const [streamError, setStreamError] = useState<string | null>(null);
  const devices = useDeviceStore((s) => s.devices);

  // Get device info for initial canvas sizing
  const deviceInfo = deviceId ? devices.find((d) => `${d.type}:${d.id}` === deviceId) : null;
  const deviceWidth = deviceInfo?.screenWidth || 360;
  const deviceHeight = deviceInfo?.screenHeight || 640;

  // Handle incoming screencast frame data
  const handleFrame = useCallback((args: any) => {
    // args = { deviceId, params } from IPC
    const params = args?.params;
    const data = params?.data;
    console.log('[ScreenView] IPC frame: args=', JSON.stringify(args)?.substring(0, 100));
    console.log('[ScreenView] frame: data present=', !!data, 'len=', data?.length, 'paramsKeys=', params ? Object.keys(params) : 'none');
    if (data) {
      setFrameData(data);
    }
  }, [setFrameData]);

  useCdpEvent('cdp:screencast:frame', handleFrame);

  // Render frame data to canvas - re-renders when frameData changes via useEffect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const { streaming: isStreaming, frameData } = useScreencastStore.getState();

      if (!isStreaming || !deviceId) {
        // Draw placeholder at device resolution
        canvas.width = deviceWidth;
        canvas.height = deviceHeight;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6a6a80';
        ctx.font = `${Math.round(canvas.height / 20)}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(
          deviceId ? 'Waiting for stream...' : 'No device connected',
          canvas.width / 2,
          canvas.height / 2,
        );
        return;
      }

      if (!frameData) return;

      const img = new Image();
      img.onload = () => {
        console.log('[ScreenView] rendering frame', img.width, 'x', img.height);
        canvas.width = img.width;
        canvas.height = img.height;
        setCanvasSize({ width: img.width, height: img.height });
        ctx.drawImage(img, 0, 0);
      };
      img.onerror = () => {
        console.error('[ScreenView] image load error, data length:', frameData.length);
      };
      img.src = `data:image/jpeg;base64,${frameData}`;
    };

    render();

    // Subscribe to entire store and re-render on any change
    const unsubscribe = useScreencastStore.subscribe(() => {
      const { frameData } = useScreencastStore.getState();
      console.log('[ScreenView] store changed, frameData len=', frameData?.length);
      render();
    });

    return unsubscribe;
  }, [deviceId, streaming, deviceWidth, deviceHeight]);

  // Sync canvas size when device changes (before streaming)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || streaming) return;
    canvas.width = deviceWidth;
    canvas.height = deviceHeight;
    setCanvasSize({ width: deviceWidth, height: deviceHeight });
  }, [deviceWidth, deviceHeight, streaming]);

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
