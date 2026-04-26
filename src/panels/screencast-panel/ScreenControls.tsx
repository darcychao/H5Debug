import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', padding: 'var(--spacing-xs)' }}>
      {!streaming ? (
        <Button size="sm" variant="primary" onClick={onStart} disabled={!deviceId}>
          {t('screencast.startStream')}
        </Button>
      ) : (
        <Button size="sm" variant="danger" onClick={onStop}>
          {t('screencast.stopStream')}
        </Button>
      )}
      <Button size="sm" variant="secondary" onClick={onScreenshot} disabled={!deviceId || !streaming}>
        {t('screencast.screenshot')}
      </Button>
    </div>
  );
};

export default ScreenControls;
