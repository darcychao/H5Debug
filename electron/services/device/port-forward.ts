import { AdbService } from './adb.service';
import { HdcService } from './hdc.service';

interface PortForwardEntry {
  deviceId: string;
  type: 'forward' | 'reverse';
  localPort: number;
  remotePort: number;
}

export class PortForwardService {
  private adb: AdbService;
  private hdc: HdcService;
  private forwards: Map<string, PortForwardEntry[]> = new Map();
  private portCounter: number;

  constructor(adb: AdbService, hdc: HdcService, portRange: [number, number] = [9222, 9322]) {
    this.adb = adb;
    this.hdc = hdc;
    this.portCounter = portRange[0];
  }

  private nextPort(): number {
    return this.portCounter++;
  }

  /** Get next available local port without setting up forwarding */
  getNextPort(): number {
    return this.portCounter++;
  }

  async setupForward(
    deviceId: string,
    deviceType: 'adb' | 'hdc',
    remotePort: number,
  ): Promise<number> {
    const localPort = this.nextPort();
    const service = deviceType === 'adb' ? this.adb : this.hdc;

    await service.forward(deviceId, localPort, remotePort);

    const entry: PortForwardEntry = {
      deviceId,
      type: 'forward',
      localPort,
      remotePort,
    };

    const existing = this.forwards.get(deviceId) || [];
    existing.push(entry);
    this.forwards.set(deviceId, existing);

    return localPort;
  }

  async setupReverse(
    deviceId: string,
    deviceType: 'adb' | 'hdc',
    localPort: number,
  ): Promise<number> {
    const remotePort = localPort;
    const service = deviceType === 'adb' ? this.adb : this.hdc;

    if (deviceType === 'adb') {
      await this.adb.reverse(deviceId, remotePort, localPort);
    } else {
      await this.hdc.reverse(deviceId, remotePort, localPort);
    }

    const entry: PortForwardEntry = {
      deviceId,
      type: 'reverse',
      localPort,
      remotePort,
    };

    const existing = this.forwards.get(deviceId) || [];
    existing.push(entry);
    this.forwards.set(deviceId, existing);

    return remotePort;
  }

  async removeForwards(deviceId: string): Promise<void> {
    const entries = this.forwards.get(deviceId) || [];
    for (const entry of entries) {
      try {
        if (entry.type === 'forward') {
          await this.adb.removeForward(deviceId, entry.localPort);
        } else if (entry.type === 'reverse') {
          await this.adb.removeReverse(deviceId, entry.localPort);
        }
      } catch {
        // Best-effort cleanup
      }
    }
    this.forwards.delete(deviceId);
  }

  /** Add a reverse entry manually (for socket forwarding via adb reverse) */
  addReverseEntry(deviceId: string, localPort: number): void {
    const existing = this.forwards.get(deviceId) || [];
    existing.push({ deviceId, type: 'reverse', localPort, remotePort: localPort });
    this.forwards.set(deviceId, existing);
  }

  getForwards(deviceId: string): PortForwardEntry[] {
    return this.forwards.get(deviceId) || [];
  }
}
