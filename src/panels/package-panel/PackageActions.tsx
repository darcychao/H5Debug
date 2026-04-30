import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../components/pixel-ui/Button';
import { usePackageStore } from '../../stores/package.store';

interface PackageActionsProps {
  deviceId: string | null;
  deviceType: 'adb' | 'hdc' | null;
}

const PackageActions: React.FC<PackageActionsProps> = ({ deviceId, deviceType }) => {
  const { t } = useTranslation();
  const { uploadAndInstall, loading } = usePackageStore();
  const [installPath, setInstallPath] = useState('');

  if (!deviceId || !deviceType) {
    return (
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end', flexShrink: 0 }}>
        <Button size="sm" variant="primary" disabled>{t('package.upload')}</Button>
      </div>
    );
  }

  const handleUpload = async () => {
    await uploadAndInstall(deviceId, deviceType);
  };

  const handleInstallByPath = async () => {
    if (!installPath.trim()) return;
    const { installPackage } = usePackageStore.getState();
    await installPackage(deviceId, deviceType, installPath.trim());
    setInstallPath('');
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end', flexShrink: 0, flexWrap: 'wrap' }}>
      <Button size="sm" variant="primary" onClick={handleUpload} disabled={loading}>
        {loading ? t('package.installing') : t('package.upload')}
      </Button>
      <div style={{ flex: 1, minWidth: 120 }}>
        <input
          className="pixel-input"
          placeholder="APK/HAP path..."
          value={installPath}
          onChange={(e) => setInstallPath(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleInstallByPath(); }}
          style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
        />
      </div>
      <Button size="sm" variant="secondary" onClick={handleInstallByPath} disabled={loading || !installPath.trim()}>
        {t('package.install')}
      </Button>
    </div>
  );
};

export default PackageActions;
