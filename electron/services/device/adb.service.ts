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

  /**
   * Find WebView processes on the device.
   * Returns process info with PID and name.
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
          console.log(`[adb] found ${processes.length} webview processes using cmd: ${cmd}`);
          return processes;
        }
      } catch {
        // try next pattern
      }
    }
    console.log(`[adb] no webview processes found with any pattern`);
    return [];
  }

  /**
   * Find all available DevTools socket names on the device.
   * Supports: webview_devtools_remote_<pid>, chrome_devtools_remote_<pid>,
   * browser_webview_devtools_remote_<pid>
   */
  async listWebViewDevToolsSockets(deviceId: string): Promise<{ sockets: string[]; rawOutput: string }> {
    try {
      // Check multiple locations for DevTools sockets
      const patterns = [
        "cat /proc/net/unix | grep -iE 'webview_devtools_remote|chrome_devtools_remote|devtools_remote'",
        "ls -la /dev/socket/ 2>/dev/null | grep -iE 'webview|chrome|devtools' || true",
        "cat /proc/net/unix | grep '@' | head -50",
      ];
      let output = '';
      for (const cmd of patterns) {
        try {
          output = await this.shell(deviceId, cmd);
          if (output.includes('devtools_remote') || output.includes('webview') || output.includes('chrome_devtools')) {
            console.log(`[adb] socket search using cmd: ${cmd}`);
            console.log(`[adb] socket output: ${output.substring(0, 300)}`);
            break;
          }
        } catch {
          // try next
        }
      }
      if (!output || (!output.includes('devtools_remote') && !output.includes('webview') && !output.includes('chrome_devtools'))) {
        console.log(`[adb] no devtools sockets found`);
        return { sockets: [], rawOutput: output || '' };
      }
      const lines = output.split('\n').filter((l) => l.trim());
      const sockets: string[] = [];
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        // For /proc/net/unix format: last column is the path (may have @ prefix)
        const path = parts[parts.length - 1];
        if (path && (path.includes('devtools_remote') || path.includes('webview_devtools') || path.includes('chrome_devtools'))) {
          const socketName = path.startsWith('@') ? path.substring(1) : path;
          sockets.push(socketName);
        }
        // Also check for socket files in /dev/socket
        if (line.includes('/dev/socket/')) {
          const match = line.match(/\/dev\/socket\/([^\s]+)/);
          if (match) {
            sockets.push(match[1]);
          }
        }
      }
      console.log(`[adb] found ${sockets.length} devtools sockets: ${sockets.join(', ')}`);
      return { sockets, rawOutput: output.substring(0, 500) };
    } catch (err) {
      return { sockets: [], rawOutput: String(err) };
    }
  }

  /**
   * Forward a localabstract socket for WebView DevTools.
   * The WebView exposes DevTools via localabstract socket named "webview_devtools_remote_<pid>"
   */
  async forwardWebViewDevTools(deviceId: string, webviewPid: string, localPort: number): Promise<string> {
    const socketName = `webview_devtools_remote_${webviewPid}`;
    // adb forward localabstract:<socket_name> tcp:<local_port>
    return this.run(['-s', deviceId, 'forward', `localabstract:${socketName}`, `tcp:${localPort}`]);
  }

  /**
   * Query /json via ADB shell using curl/wget to a local TCP port
   * This bypasses the WebSocket bridge issue.
   */
  async queryJsonViaShell(deviceId: string, tcpPort: number): Promise<string> {
    try {
      // Try multiple HTTP clients in order of preference
      const commands = [
        `curl -s http://127.0.0.1:${tcpPort}/json`,
        `curl -s http://localhost:${tcpPort}/json`,
        `wget -q -O - http://127.0.0.1:${tcpPort}/json`,
        `wget -q -O - http://localhost:${tcpPort}/json`,
        // Try busybox wget if available
        `busybox wget -q -O - http://127.0.0.1:${tcpPort}/json`,
      ];
      for (const cmd of commands) {
        try {
          const output = await this.shell(deviceId, `${cmd} 2>/dev/null`);
          if (output && output.trim().length > 0 && !output.includes('not found') && !output.includes('No such file')) {
            console.log(`[adb] /json via shell on port ${tcpPort} (${cmd}): ${output.substring(0, 200)}`);
            return output;
          }
        } catch {
          // try next
        }
      }
      console.log(`[adb] /json via shell on port ${tcpPort}: no HTTP client available`);
      return '';
    } catch (err) {
      console.log(`[adb] /json via shell failed: ${err}`);
      return '';
    }
  }

  /**
   * Try to get WebView DevTools URL via chrome://inspect.
   * On Android Chrome, this page shows available WebViews with their DevTools URLs.
   * We access it via ADB shell curl.
   */
  async getChromeInspectPages(deviceId: string): Promise<Array<{ id: string; title: string; url: string; webSocketDebuggerUrl: string }>> {
    try {
      // Try accessing chrome's DevTools via the forwarded browser port
      const output1 = await this.queryJsonViaShell(deviceId, 9222);
      if (output1 && output1.startsWith('[')) {
        console.log(`[adb] got /json from browser port: ${output1.substring(0, 200)}`);
        return JSON.parse(output1);
      }
      // Try via localhost:9222 directly (if port was forwarded)
      const output2 = await this.shell(deviceId, `curl -s http://localhost:9222/json 2>/dev/null || curl -s http://127.0.0.1:9222/json 2>/dev/null || echo "failed"`);
      if (output2 && output2.startsWith('[')) {
        console.log(`[adb] got /json via localhost: ${output2.substring(0, 200)}`);
        return JSON.parse(output2);
      }
      console.log(`[adb] no targets from chrome inspect: ${output1.substring(0, 100)}`);
      return [];
    } catch (err) {
      console.log(`[adb] getChromeInspectPages failed: ${err}`);
      return [];
    }
  }

  /**
   * Forward a localabstract socket by name.
   *
   * Correct format: adb forward tcp:LOCAL_PORT localabstract:SOCKET_NAME
   * The remote (device) side connects to its abstract socket, so this works
   * for both SOCK_STREAM and SOCK_SEQPACKET sockets.
   */
  async forwardSocket(deviceId: string, socketName: string, localPort: number): Promise<number> {
    const maxRetries = 10;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const port = localPort + attempt;

      // adb forward tcp:LOCAL localabstract:SOCKET — remote side connects to socket
      try {
        console.log(`[adb] trying adb forward tcp:${port} localabstract:"${socketName}"`);
        await this.run(['-s', deviceId, 'forward', `tcp:${port}`, `localabstract:${socketName}`]);
        console.log(`[adb] adb forward succeeded on port ${port}`);
        return port;
      } catch (err) {
        const errStr = String(err);
        if (errStr.includes('Address already in use') || errStr.includes('already in use')) {
          console.log(`[adb] port ${port} in use, trying next`);
          continue;
        }
        console.log(`[adb] adb forward failed: ${err}`);
      }
    }

    throw new Error(`adb forward failed for socket: ${socketName} after ${maxRetries} retries`);
  }
}
