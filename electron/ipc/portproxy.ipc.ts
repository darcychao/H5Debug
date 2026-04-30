import { ipcMain } from 'electron';
import { AdbService } from '../services/device/adb.service';
import { HdcService } from '../services/device/hdc.service';

export function registerPortProxyIpc(adb: AdbService, hdc: HdcService) {
  // Apply a port proxy rule: forward or reverse
  ipcMain.handle('portproxy:apply', async (_event, deviceId: string, deviceType: 'adb' | 'hdc', rule: {
    type: 'forward' | 'reverse';
    localPort: number;
    remotePort: number;
  }) => {
    const service = deviceType === 'adb' ? adb : hdc;
    try {
      if (rule.type === 'forward') {
        if (deviceType === 'adb') {
          await adb.forward(deviceId, rule.localPort, rule.remotePort);
        } else {
          await hdc.forward(deviceId, rule.localPort, rule.remotePort);
        }
      } else {
        if (deviceType === 'adb') {
          await adb.reverse(deviceId, rule.remotePort, rule.localPort);
        } else {
          await hdc.reverse(deviceId, rule.remotePort, rule.localPort);
        }
      }
      console.log(`[portproxy] ${rule.type} applied: ${deviceType}:${deviceId} tcp:${rule.localPort} <-> tcp:${rule.remotePort}`);
      return { success: true };
    } catch (err) {
      console.error(`[portproxy] Failed to apply ${rule.type}:`, err);
      return { success: false, error: String(err) };
    }
  });

  // Remove a port proxy rule
  ipcMain.handle('portproxy:remove', async (_event, deviceId: string, deviceType: 'adb' | 'hdc', rule: {
    type: 'forward' | 'reverse';
    localPort: number;
    remotePort: number;
  }) => {
    try {
      if (rule.type === 'forward') {
        if (deviceType === 'adb') {
          await adb.removeForward(deviceId, rule.localPort);
        }
        // hdc doesn't have a direct removeForward — closing the session removes it
      } else {
        if (deviceType === 'adb') {
          await adb.removeReverse(deviceId, rule.remotePort);
        }
      }
      console.log(`[portproxy] ${rule.type} removed: ${deviceType}:${deviceId} tcp:${rule.localPort}`);
      return { success: true };
    } catch (err) {
      console.error(`[portproxy] Failed to remove ${rule.type}:`, err);
      return { success: false, error: String(err) };
    }
  });
}
