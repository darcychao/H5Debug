import { EventEmitter } from 'events';
import { AdbService } from './adb.service';
import { HdcService } from './hdc.service';
import { PortForwardService } from './port-forward';

export interface DeviceInfo {
  id: string;
  type: 'adb' | 'hdc';
  model: string;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  cdpPort: number;
  status: 'connected' | 'disconnected' | 'connecting';
  lastActiveAt: number;
}

export class DeviceManager extends EventEmitter {
  private adb: AdbService;
  private hdc: HdcService;
  private portForward: PortForwardService;
  private devices: Map<string, DeviceInfo> = new Map();
  private watchInterval: NodeJS.Timeout | null = null;

  constructor(adbPath = 'adb', hdcPath = 'hdc', portRange: [number, number] = [9222, 9322]) {
    super();
    this.adb = new AdbService(adbPath);
    this.hdc = new HdcService(hdcPath);
    this.portForward = new PortForwardService(this.adb, this.hdc, portRange);
  }

  async listDevices(): Promise<DeviceInfo[]> {
    const devices: DeviceInfo[] = [];

    try {
      const adbDevices = await this.adb.listDevices();
      for (const d of adbDevices) {
        if (d.state !== 'device') continue;
        let info = this.devices.get(`adb:${d.id}`);
        if (!info) {
          try {
            const detail = await this.adb.getDeviceInfo(d.id);
            info = {
              id: d.id,
              type: 'adb',
              model: detail.model,
              osVersion: detail.androidVersion,
              screenWidth: detail.screenWidth,
              screenHeight: detail.screenHeight,
              cdpPort: 0,
              status: 'disconnected',
              lastActiveAt: Date.now(),
            };
          } catch {
            info = {
              id: d.id,
              type: 'adb',
              model: d.model,
              osVersion: 'unknown',
              screenWidth: 0,
              screenHeight: 0,
              cdpPort: 0,
              status: 'disconnected',
              lastActiveAt: Date.now(),
            };
          }
          this.devices.set(`adb:${d.id}`, info);
        }
        devices.push(info);
      }
    } catch {
      // adb not available
    }

    try {
      const hdcDevices = await this.hdc.listDevices();
      for (const d of hdcDevices) {
        let info = this.devices.get(`hdc:${d.id}`);
        if (!info) {
          try {
            const detail = await this.hdc.getDeviceInfo(d.id);
            info = {
              id: d.id,
              type: 'hdc',
              model: detail.model,
              osVersion: detail.osVersion,
              screenWidth: detail.screenWidth,
              screenHeight: detail.screenHeight,
              cdpPort: 0,
              status: 'disconnected',
              lastActiveAt: Date.now(),
            };
          } catch {
            info = {
              id: d.id,
              type: 'hdc',
              model: 'unknown',
              osVersion: 'unknown',
              screenWidth: 0,
              screenHeight: 0,
              cdpPort: 0,
              status: 'disconnected',
              lastActiveAt: Date.now(),
            };
          }
          this.devices.set(`hdc:${d.id}`, info);
        }
        devices.push(info);
      }
    } catch {
      // hdc not available
    }

    return devices;
  }

  async connect(deviceId: string, deviceType: 'adb' | 'hdc'): Promise<DeviceInfo> {
    const key = `${deviceType}:${deviceId}`;
    const info = this.devices.get(key);
    if (!info) throw new Error(`Device ${key} not found`);
    if (info.status === 'connected') return info;

    info.status = 'connecting';
    this.emit('device:changed', info);

    try {
      const cdpPort = await this.portForward.setupForward(deviceId, deviceType, 9222);
      info.cdpPort = cdpPort;
      info.status = 'connected';
      info.lastActiveAt = Date.now();
    } catch (err) {
      info.status = 'disconnected';
      this.emit('device:changed', info);
      throw err;
    }

    this.emit('device:changed', info);
    return info;
  }

  async disconnect(deviceId: string, deviceType: 'adb' | 'hdc'): Promise<void> {
    const key = `${deviceType}:${deviceId}`;
    const info = this.devices.get(key);
    if (!info) return;

    await this.portForward.removeForwards(deviceId);
    info.cdpPort = 0;
    info.status = 'disconnected';
    this.emit('device:changed', info);
  }

  watchDevices(intervalMs = 3000): void {
    if (this.watchInterval) return;

    const poll = async () => {
      try {
        const current = await this.listDevices();
        this.emit('devices:refreshed', current);
      } catch {
        // ignore polling errors
      }
    };

    poll();
    this.watchInterval = setInterval(poll, intervalMs);
  }

  stopWatching(): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
  }

  getConnectedDevices(): DeviceInfo[] {
    return Array.from(this.devices.values()).filter((d) => d.status === 'connected');
  }

  getDevice(key: string): DeviceInfo | undefined {
    return this.devices.get(key);
  }
}
