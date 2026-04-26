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
  /** webview pid -> locally forwarded port */
  webviewPorts?: Record<string, number>;
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
    info.lastActiveAt = Date.now();
    this.emit('device:changed', info);

    const service = deviceType === 'adb' ? this.adb : this.hdc;

    try {
      // Set up browser port forwarding (chrome remote debugging port 9222)
      const cdpPort = await this.portForward.setupForward(deviceId, deviceType, 9222);
      info.cdpPort = cdpPort;
      console.log(`[device:connect] browser cdpPort=${cdpPort}`);

      // Try to get WebView targets via chrome://inspect JSON from device shell
      const inspectPages = await service.getChromeInspectPages(deviceId);
      console.log(`[device:connect] getChromeInspectPages found ${inspectPages.length} targets`);
      const webviewPorts: Record<string, number> = {};
      for (const page of inspectPages) {
        if (page.webSocketDebuggerUrl) {
          console.log(`[device:connect] WebView target: id=${page.id} title=${page.title} url=${page.webSocketDebuggerUrl}`);
        }
      }

      // Also scan for webview_devtools_remote sockets as fallback
      const socketsResult = await service.listWebViewDevToolsSockets(deviceId);
      const sockets = socketsResult.sockets;
      console.log(`[device:connect] found ${sockets.length} WebView devtools sockets`);
      for (const socket of sockets) {
        try {
          const localPort = await this.portForward.getNextPort();
          const actualPort = await service.forwardSocket(deviceId, socket, localPort);
          webviewPorts[`socket:${socket}`] = actualPort;
          // Track the reverse entry for cleanup
          this.portForward.addReverseEntry(deviceId, actualPort);
          console.log(`[device:connect] webview socket=${socket} -> local port=${actualPort}`);
        } catch (err) {
          console.log(`[device:connect] failed to forward socket=${socket}: ${err}`);
        }
      }

      info.webviewPorts = webviewPorts;
    } catch (err) {
      info.status = 'disconnected';
      this.emit('device:changed', info);
      throw err;
    }

    return info;
  }

  async disconnect(deviceId: string, deviceType: 'adb' | 'hdc'): Promise<void> {
    const key = `${deviceType}:${deviceId}`;
    const info = this.devices.get(key);
    if (!info) return;

    await this.portForward.removeForwards(deviceId);
    info.cdpPort = 0;
    info.webviewPorts = {};
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
