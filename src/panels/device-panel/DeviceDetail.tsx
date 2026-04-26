import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import { useDeviceStore } from '../../stores/device.store';

interface DeviceDetailProps {
  deviceId: string | null;
}

const DeviceDetail: React.FC<DeviceDetailProps> = ({ deviceId }) => {
  const { t } = useTranslation();
  const devices = useDeviceStore((s) => s.devices);
  const { connectDevice, disconnectDevice } = useDeviceStore();
  const [debugInfo, setDebugInfo] = useState<string>('');

  const device = deviceId
    ? devices.find((d) => `${d.type}:${d.id}` === deviceId)
    : null;

  const runDebug = async (label: string, invoke: () => Promise<unknown>) => {
    try {
      const result = await invoke();
      setDebugInfo(`${label}:\n${JSON.stringify(result, null, 2)}`);
    } catch (err: unknown) {
      setDebugInfo(`${label} error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (!device) {
    return (
      <Card title={t('device.title')}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          {t('device.noDevice')}
        </div>
      </Card>
    );
  }

  return (
    <Card title={t('device.title')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', fontSize: 'var(--font-size-xs)' }}>
        <DetailRow label={t('device.type')} value={device.type.toUpperCase()} />
        <DetailRow label={t('device.model')} value={device.model} />
        <DetailRow label={t('device.osVersion')} value={device.osVersion} />
        <DetailRow label={t('device.screen')} value={`${device.screenWidth}x${device.screenHeight}`} />
        <DetailRow label={t('device.cdpPort')} value={device.cdpPort ? String(device.cdpPort) : '--'} />
        <DetailRow label={t('device.status')} value={device.status} />
        <DetailRow label={t('device.lastActive')} value={new Date(device.lastActiveAt).toLocaleTimeString()} />
        {(device as any).webviewPorts && Object.keys((device as any).webviewPorts).length > 0 && (
          <DetailRow
            label={t('device.webviewPorts')}
            value={JSON.stringify((device as any).webviewPorts)}
          />
        )}

        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
          {device.status !== 'connected' ? (
            <Button size="sm" variant="primary" onClick={() => connectDevice(device.id, device.type)}>{t('device.connect')}</Button>
          ) : (
            <Button size="sm" variant="danger" onClick={() => disconnectDevice(device.id, device.type)}>{t('device.disconnect')}</Button>
          )}
        </div>

        {/* Debug section */}
        <div style={{ marginTop: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-sm)' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px', fontSize: '10px' }}>DEBUG</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <Button size="sm" variant="ghost" onClick={() => runDebug('Processes', () => window.electronAPI!.invoke('debug:listProcesses', device.id, device.type) as Promise<unknown>)}>List Processes</Button>
            <Button size="sm" variant="ghost" onClick={() => runDebug('Sockets', () => window.electronAPI!.invoke('debug:listSockets', device.id, device.type) as Promise<unknown>)}>List Sockets</Button>
            <Button size="sm" variant="ghost" onClick={() => runDebug(`Browser:${device.cdpPort}`, () => window.electronAPI!.invoke('debug:listTargets', device.cdpPort) as Promise<unknown>)}>List Targets</Button>
            <Button size="sm" variant="ghost" onClick={() => runDebug('All Procs', () => window.electronAPI!.invoke('debug:listAllProcesses', device.id, device.type) as Promise<unknown>)}>All Procs</Button>
            <Button size="sm" variant="ghost" onClick={() => runDebug('WV Shell', () => window.electronAPI!.invoke('debug:queryJsonViaShell', device.id, device.type, 9235) as Promise<unknown>)}>WV Shell</Button>
          </div>
          {debugInfo && (
            <pre style={{ fontSize: '9px', color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', padding: '4px', borderRadius: '4px', overflow: 'auto', maxHeight: '120px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{debugInfo}</pre>
          )}
        </div>
      </div>
    </Card>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
    <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    <span style={{ color: 'var(--color-text-primary)' }}>{value}</span>
  </div>
);

export default DeviceDetail;
