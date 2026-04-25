import { ipcMain, BrowserWindow } from 'electron';
import { TestEngine, TestCase, TestReport } from '../services/testcase/engine';
import { Recorder } from '../services/testcase/recorder';
import { ReportGenerator } from '../services/testcase/report-generator';

export function registerTestcaseIpc(
  testEngine: TestEngine,
  recorder: Recorder,
  reportGenerator: ReportGenerator,
  mainWindow: BrowserWindow,
) {
  ipcMain.handle('testcase:crud', async (_event, action: string, data: any) => {
    // CRUD operations would go through SQLite in production
    // For now, this is a pass-through
    return { action, data };
  });

  ipcMain.handle('testcase:execute', async (_event, testCaseOrAssignments: any, deviceId?: string) => {
    if (Array.isArray(testCaseOrAssignments)) {
      // Batch execution
      const reports = await testEngine.executeBatch(testCaseOrAssignments);
      for (const report of reports) {
        await reportGenerator.generate(report);
      }
      return reports;
    } else {
      // Single execution
      const report = await testEngine.execute(testCaseOrAssignments as TestCase, deviceId || '');
      await reportGenerator.generate(report);
      return report;
    }
  });

  ipcMain.handle('testcase:record:start', async (_event, deviceId: string) => {
    const client = (testEngine as any).cdpPool?.getClient(deviceId);
    if (!client) throw new Error(`No CDP client for device: ${deviceId}`);
    await recorder.start(client);
  });

  ipcMain.handle('testcase:record:stop', async () => {
    return recorder.stop();
  });

  // Push recording steps
  recorder.on('recording:step', (step: any) => {
    mainWindow.webContents.send('testcase:record:step', step);
  });
}
