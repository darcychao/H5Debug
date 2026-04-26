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

  async removeReverse(deviceId: string, remotePort: number): Promise<string> {
    return this.run(['-t', deviceId, 'rport', '--remove', `tcp:${remotePort}`]);
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

  /**
   * Find WebView processes on the device.
   */
  async listWebViewProcesses(deviceId: string): Promise<Array<{ pid: string; name: string; user: string }>> {
    const patterns = [
      "ps -A 2>/dev/null | grep -iE 'webview|wethost|chrome' | grep -v grep",
      "ps -ef 2>/dev/null | grep -iE 'webview|wethost|chrome' | grep -v grep",
      "ps 2>/dev/null | grep -iE 'webview|wethost' | grep -v grep",
    ];
    for (const cmd of patterns) {
      try {
        const output = await this.shell(deviceId, cmd);
        const lines = output.split('\n').filter((l) => l.trim());
        const processes = lines.map((line) => {
          const parts = line.trim().split(/\s+/);
          return {
            user: parts[0] || '',
            pid: parts[1] || parts[0] || '',
            name: parts[parts.length - 1] || '',
          };
        }).filter((p) => p.pid && p.name && p.name.length > 0);
        if (processes.length > 0) {
          console.log(`[hdc] found ${processes.length} webview processes using cmd: ${cmd}`);
          return processes;
        }
      } catch {
        // try next pattern
      }
    }
    console.log(`[hdc] no webview processes found with any pattern`);
    return [];
  }

  /**
   * Find all available WebView DevTools socket names on the device.
   */
  async listWebViewDevToolsSockets(deviceId: string): Promise<{ sockets: string[]; rawOutput: string }> {
    try {
      const output = await this.shell(deviceId, "cat /proc/net/unix | grep -i webview_devtools_remote");
      const lines = output.split('\n').filter((l) => l.trim());
      const sockets: string[] = [];
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const path = parts[parts.length - 1];
        if (path && (path.includes('webview_devtools_remote') || path.includes('chrome_devtools_remote'))) {
          const socketName = path.startsWith('@') ? path.substring(1) : path;
          sockets.push(socketName);
        }
      }
      console.log(`[hdc] found ${sockets.length} devtools sockets: ${sockets.join(', ')}`);
      return { sockets, rawOutput: output.substring(0, 500) };
    } catch (err) {
      return { sockets: [], rawOutput: String(err) };
    }
  }

  /**
   * Forward a localabstract socket for WebView DevTools.
   */
  async forwardWebViewDevTools(deviceId: string, webviewPid: string, localPort: number): Promise<string> {
    const socketName = `webview_devtools_remote_${webviewPid}`;
    return this.run(['-t', deviceId, 'fport', `localabstract:${socketName}`, `tcp:${localPort}`]);
  }

  /**
   * Forward a localabstract socket by name.
   * For SEQPACKET sockets, uses hdc reverse (reverse tunnel from device socket to host).
   */
  async forwardSocket(deviceId: string, socketName: string, localPort: number): Promise<number> {
    // Try hdc reverse for seqpacket socket bridging
    try {
      console.log(`[hdc] trying hdc reverse localabstract:"${socketName}" tcp:${localPort}`);
      await this.run(['-t', deviceId, 'rport', `localabstract:${socketName}`, `tcp:${localPort}`]);
      console.log(`[hdc] hdc reverse succeeded`);
      return localPort;
    } catch (err) {
      console.log(`[hdc] hdc reverse failed: ${err}`);
    }
    throw new Error(`hdc reverse failed for socket: ${socketName}`);
  }

  /**
   * Query /json via HDC shell using curl/wget.
   */
  async queryJsonViaShell(deviceId: string, tcpPort: number): Promise<string> {
    try {
      const output = await this.shell(deviceId, `curl -s http://127.0.0.1:${tcpPort}/json 2>/dev/null || wget -q -O - http://127.0.0.1:${tcpPort}/json 2>/dev/null || echo "no http client"`);
      console.log(`[hdc] /json via shell on port ${tcpPort}: ${output.substring(0, 200)}`);
      return output;
    } catch (err) {
      console.log(`[hdc] /json via shell failed: ${err}`);
      return '';
    }
  }
}
