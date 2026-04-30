import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import Input from '../../components/pixel-ui/Input';
import { usePackageStore } from '../../stores/package.store';

interface PackageListProps {
  deviceId: string | null;
  deviceType: 'adb' | 'hdc' | null;
}

const PackageList: React.FC<PackageListProps> = ({ deviceId, deviceType }) => {
  const { t } = useTranslation();
  const { filteredPackages, loading, error, fetchPackages, setFilter, uninstallPackage, clearCache } = usePackageStore();
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);

  // Fetch packages when device connects or changes
  useEffect(() => {
    if (deviceId && deviceType) {
      fetchPackages(deviceId, deviceType);
    }
  }, [deviceId, deviceType, fetchPackages]);

  const handleRefresh = () => {
    if (deviceId && deviceType) {
      fetchPackages(deviceId, deviceType);
    }
  };

  const handleUninstall = async (pkg: string) => {
    if (!deviceId || !deviceType) return;
    await uninstallPackage(deviceId, deviceType, pkg);
    setSelectedPkg(null);
  };

  const handleClearCache = async (pkg: string) => {
    if (!deviceId || !deviceType) return;
    await clearCache(deviceId, deviceType, pkg);
  };

  if (!deviceId || !deviceType) {
    return (
      <Card title={t('package.title')} className="package-list-card">
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          {t('package.noDevice')}
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={t('package.title')}
      className="package-list-card"
      headerActions={
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {filteredPackages.length}
          </span>
          <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={loading}>
            {loading ? t('package.loading') : t('package.refresh')}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <div style={{ flexShrink: 0, marginBottom: 'var(--spacing-sm)' }}>
          <Input
            placeholder={t('package.placeholder')}
            onChange={(e) => setFilter((e.target as HTMLInputElement).value)}
            style={{ fontSize: 'var(--font-size-xs)' }}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)', padding: 'var(--spacing-xs)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--spacing-sm)' }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {loading && filteredPackages.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
              {t('package.loading')}
            </div>
          ) : filteredPackages.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
              {t('package.noPackages')}
            </div>
          ) : (
            filteredPackages.map((pkg) => (
              <div
                key={pkg.name}
                className={`device-item ${selectedPkg === pkg.name ? 'device-item--active' : ''}`}
                onClick={() => setSelectedPkg(selectedPkg === pkg.name ? null : pkg.name)}
                style={{ cursor: 'pointer' }}
              >
                <span
                  className="device-item-status"
                  style={{ background: 'var(--color-accent)' }}
                />
                <span
                  className="device-item-name"
                  style={{ fontSize: 'var(--font-size-xs)', wordBreak: 'break-all' }}
                  title={pkg.name}
                >
                  {pkg.name}
                </span>
                {selectedPkg === pkg.name && (
                  <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', flexShrink: 0 }}>
                    <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleUninstall(pkg.name); }} disabled={loading}>
                      {t('package.uninstall')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleClearCache(pkg.name); }} disabled={loading}>
                      {t('package.clearCache')}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

export default PackageList;
