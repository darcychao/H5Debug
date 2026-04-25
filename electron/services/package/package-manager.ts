import { AdbService } from '../device/adb.service';
import { HdcService } from '../device/hdc.service';

export class PackageManager {
  private adb: AdbService;
  private hdc: HdcService;

  constructor(adb: AdbService, hdc: HdcService) {
    this.adb = adb;
    this.hdc = hdc;
  }

  async listPackages(deviceId: string, type: 'adb' | 'hdc'): Promise<string[]> {
    const service = type === 'adb' ? this.adb : this.hdc;
    return service.listPackages(deviceId);
  }

  async install(deviceId: string, type: 'adb' | 'hdc', packagePath: string): Promise<string> {
    const service = type === 'adb' ? this.adb : this.hdc;
    return service.install(deviceId, packagePath);
  }

  async uninstall(deviceId: string, type: 'adb' | 'hdc', packageName: string): Promise<string> {
    const service = type === 'adb' ? this.adb : this.hdc;
    return service.uninstall(deviceId, packageName);
  }

  async clearCache(deviceId: string, type: 'adb' | 'hdc', packageName: string): Promise<string> {
    const service = type === 'adb' ? this.adb : this.hdc;
    return service.clearCache(deviceId, packageName);
  }
}
