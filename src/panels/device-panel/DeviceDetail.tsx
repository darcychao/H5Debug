import React from 'react';
import Card from '../../components/pixel-ui/Card';
import { useDeviceStore } from '../../stores/device.store';

interface DeviceDetailProps {
  deviceId: string | null;
}

const DeviceDetail: React.FC<DeviceDetailProps> = ({ deviceId }) => {
  const devices = useDeviceStore((s) => s.devices);

  const device = deviceId
    ? devices.find((d) => `${d.type}:${d.id}` === deviceId)
    : null;

  if (!device) {
    return (
      <Card title="Device Detail">
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          No device selected
        </div>
      </Card>
    );
  }

  return (
    <Card title="Device Detail">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', fontSize: 'var(--font-size-xs)' }}>
        <DetailRow label="Type" value={device.type.toUpperCase()} />
        <DetailRow label="Model" value={device.model} />
        <DetailRow label="OS Version" value={device.osVersion} />
        <DetailRow label="Screen" value={`${device.screenWidth}x${device.screenHeight}`} />
        <DetailRow label="CDP Port" value={device.cdpPort ? String(device.cdpPort) : '--'} />
        <DetailRow label="Status" value={device.status} />
        <DetailRow label="Last Active" value={new Date(device.lastActiveAt).toLocaleTimeString()} />
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
