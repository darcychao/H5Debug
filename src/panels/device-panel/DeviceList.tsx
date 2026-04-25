import React, { useEffect } from 'react';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import { useDeviceStore, DeviceInfo } from '../../stores/device.store';
import './DeviceList.css';

interface DeviceListProps {
  onDeviceSelect: (deviceId: string) => void;
  activeDeviceId: string | null;
}

const DeviceList: React.FC<DeviceListProps> = ({ onDeviceSelect, activeDeviceId }) => {
  const { devices, fetchDevices, connectDevice, disconnectDevice } = useDeviceStore();

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  useEffect(() => {
    if (!window.electronAPI) return;
    const unsub = window.electronAPI.on('device:changed', () => {
      fetchDevices();
    });
    return unsub;
  }, [fetchDevices]);

  const adbDevices = devices.filter((d) => d.type === 'adb');
  const hdcDevices = devices.filter((d) => d.type === 'hdc');

  const renderDevice = (device: DeviceInfo) => {
    const key = `${device.type}:${device.id}`;
    const isActive = activeDeviceId === key;

    return (
      <div
        key={key}
        className={`device-item ${isActive ? 'device-item--active' : ''}`}
        onClick={() => onDeviceSelect(key)}
      >
        <span
          className={`device-item-status ${
            device.status === 'connected'
              ? ''
              : device.status === 'connecting'
              ? 'device-item-status--connecting'
              : 'device-item-status--disconnected'
          }`}
        />
        <span className="device-item-name">{device.model}</span>
        <span className="device-item-id">{device.id}</span>
        {device.status === 'disconnected' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              connectDevice(device.id, device.type);
            }}
          >
            Connect
          </Button>
        )}
        {device.status === 'connected' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              disconnectDevice(device.id, device.type);
            }}
          >
            Disconnect
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="device-list">
      <Card title="ADB Devices" className="device-list-section">
        {adbDevices.length > 0 ? adbDevices.map(renderDevice) : (
          <div className="device-list-empty">No ADB devices</div>
        )}
      </Card>
      <Card title="HDC Devices" className="device-list-section">
        {hdcDevices.length > 0 ? hdcDevices.map(renderDevice) : (
          <div className="device-list-empty">No HDC devices</div>
        )}
      </Card>
    </div>
  );
};

export default DeviceList;
