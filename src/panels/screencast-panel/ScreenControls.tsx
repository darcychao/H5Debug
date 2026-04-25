import React from 'react';
import Button from '../../components/pixel-ui/Button';

interface ScreenControlsProps {
  deviceId: string | null;
  streaming: boolean;
  onStart: () => void;
  onStop: () => void;
  onScreenshot: () => void;
}

const ScreenControls: React.FC<ScreenControlsProps> = ({
  deviceId,
  streaming,
  onStart,
  onStop,
  onScreenshot,
}) => {
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', padding: 'var(--spacing-xs)' }}>
      {!streaming ? (
        <Button size="sm" variant="primary" onClick={onStart} disabled={!deviceId}>
          Start Stream
        </Button>
      ) : (
        <Button size="sm" variant="danger" onClick={onStop}>
          Stop Stream
        </Button>
      )}
      <Button size="sm" variant="secondary" onClick={onScreenshot} disabled={!deviceId || !streaming}>
        Screenshot
      </Button>
    </div>
  );
};

export default ScreenControls;
