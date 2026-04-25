import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class AdbService {
  private adbPath: string;

  constructor(adbPath: string = 'adb') {
    this.adbPath = adbPath;
  }

  private async run(args: string[]): Promise<string> {
    const { stdout } = await execFileAsync(this.adbPath, args, { timeout: 30000 });
    return stdout.trim();
  }

  async listDevices(): Promise<Array<{ id: string; state: string; model: string }>> {
    const output = await this.run(['devices', '-l']);
    const lines = output.split('\n').slice(1).filter((l) => l.trim());
    return lines.map((line) => {
      const parts = line.split(/\s+/);
      const id = parts[0];
      const state = parts[1];
      let model = 'unknown';
      for (const part of parts) {
        if (part.startsWith('model:')) {
          model = part.replace('model:', '');
        }
      }
      return { id, state, model };
    });
  }

  async getDeviceInfo(id: string): Promise<{
    model: string;
    androidVersion: string;
    screenWidth: number;
    screenHeight: number;
  }> {
    const [model, version, size] = await Promise.all([
      this.run(['-s', id, 'shell', 'getprop', 'ro.product.model']),
      this.run(['-s', id, 'shell', 'getprop', 'ro.build.version.release']),
      this.run(['-s', id, 'shell', 'wm', 'size']),
    ]);

    const match = size.match(/(\d+)x(\d+)/);
    return {
      model: model || 'unknown',
      androidVersion: version || 'unknown',
      screenWidth: match ? parseInt(match[1]) : 0,
      screenHeight: match ? parseInt(match[2]) : 0,
    };
  }

  async forward(deviceId: string, localPort: number, remotePort: number): Promise<string> {
    return this.run(['-s', deviceId, 'forward', `tcp:${localPort}`, `tcp:${remotePort}`]);
  }

  async reverse(deviceId: string, remotePort: number, localPort: number): Promise<string> {
    return this.run(['-s', deviceId, 'reverse', `tcp:${remotePort}`, `tcp:${localPort}`]);
  }

  async removeForward(deviceId: string, localPort: number): Promise<string> {
    return this.run(['-s', deviceId, 'forward', '--remove', `tcp:${localPort}`]);
  }

  async removeReverse(deviceId: string, remotePort: number): Promise<string> {
    return this.run(['-s', deviceId, 'reverse', '--remove', `tcp:${remotePort}`]);
  }

  async install(deviceId: string, apkPath: string): Promise<string> {
    return this.run(['-s', deviceId, 'install', '-r', apkPath]);
  }

  async uninstall(deviceId: string, pkg: string): Promise<string> {
    return this.run(['-s', deviceId, 'uninstall', pkg]);
  }

  async clearCache(deviceId: string, pkg: string): Promise<string> {
    return this.run(['-s', deviceId, 'shell', 'pm', 'clear', pkg]);
  }

  async listPackages(deviceId: string): Promise<string[]> {
    const output = await this.run(['-s', deviceId, 'shell', 'pm', 'list', 'packages']);
    return output
      .split('\n')
      .filter((l) => l.startsWith('package:'))
      .map((l) => l.replace('package:', '').trim());
  }

  async shell(deviceId: string, cmd: string): Promise<string> {
    return this.run(['-s', deviceId, 'shell', cmd]);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.run(['version']);
      return true;
    } catch {
      return false;
    }
  }
}
