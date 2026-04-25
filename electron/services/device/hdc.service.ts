import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class HdcService {
  private hdcPath: string;

  constructor(hdcPath: string = 'hdc') {
    this.hdcPath = hdcPath;
  }

  private async run(args: string[]): Promise<string> {
    const { stdout } = await execFileAsync(this.hdcPath, args, { timeout: 30000 });
    return stdout.trim();
  }

  async listDevices(): Promise<Array<{ id: string; state: string; model: string }>> {
    const output = await this.run(['list', 'targets']);
    const lines = output.split('\n').filter((l) => l.trim());
    return lines.map((line) => ({
      id: line.trim(),
      state: 'device',
      model: 'unknown',
    }));
  }

  async getDeviceInfo(id: string): Promise<{
    model: string;
    osVersion: string;
    screenWidth: number;
    screenHeight: number;
  }> {
    try {
      const [model, version, size] = await Promise.all([
        this.run(['-t', id, 'shell', 'param', 'get', 'const.product.devicetype']),
        this.run(['-t', id, 'shell', 'param', 'get', 'const.ohos.fullname.release']),
        this.run(['-t', id, 'shell', 'param', 'get', 'const.display.resolution']),
      ]);

      const match = size.match(/(\d+)[*xX](\d+)/);
      return {
        model: model || 'unknown',
        osVersion: version || 'unknown',
        screenWidth: match ? parseInt(match[1]) : 0,
        screenHeight: match ? parseInt(match[2]) : 0,
      };
    } catch {
      return { model: 'unknown', osVersion: 'unknown', screenWidth: 0, screenHeight: 0 };
    }
  }

  async forward(deviceId: string, localPort: number, remotePort: number): Promise<string> {
    return this.run(['-t', deviceId, 'fport', `tcp:${localPort}`, `tcp:${remotePort}`]);
  }

  async reverse(deviceId: string, remotePort: number, localPort: number): Promise<string> {
    return this.run(['-t', deviceId, 'rport', `tcp:${remotePort}`, `tcp:${localPort}`]);
  }

  async install(deviceId: string, hapPath: string): Promise<string> {
    return this.run(['-t', deviceId, 'install', hapPath]);
  }

  async uninstall(deviceId: string, pkg: string): Promise<string> {
    return this.run(['-t', deviceId, 'uninstall', pkg]);
  }

  async clearCache(deviceId: string, pkg: string): Promise<string> {
    return this.run(['-t', deviceId, 'shell', 'bm', 'clean', '-n', pkg, '-d']);
  }

  async listPackages(deviceId: string): Promise<string[]> {
    const output = await this.run(['-t', deviceId, 'shell', 'bm', 'dump', '-a']);
    return output
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

  async shell(deviceId: string, cmd: string): Promise<string> {
    return this.run(['-t', deviceId, 'shell', cmd]);
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
