import { ipcMain, BrowserWindow } from 'electron';
import { TestEngine, TestCase } from '../services/testcase/engine';
import { Recorder } from '../services/testcase/recorder';
import { ReportGenerator } from '../services/testcase/report-generator';
import {
  getAllTestCases,
  getTestCase,
  createTestCase,
  updateTestCase,
  deleteTestCase,
} from '../db/testcase.repo';

export function registerTestcaseIpc(
  testEngine: TestEngine,
  recorder: Recorder,
  reportGenerator: ReportGenerator,
  mainWindow: BrowserWindow,
) {
  // Get all test cases
  ipcMain.handle('testcase:list', async () => {
    const rows = getAllTestCases();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      author: row.author,
      deviceId: row.device_id,
      steps: JSON.parse(row.steps),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  });

  // Get a single test case
  ipcMain.handle('testcase:get', async (_event, id: string) => {
    const row = getTestCase(id);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      author: row.author,
      deviceId: row.device_id,
      steps: JSON.parse(row.steps),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  // Create a test case
  ipcMain.handle('testcase:create', async (_event, tc: TestCase) => {
    createTestCase({
      id: tc.id,
      name: tc.name,
      description: tc.description,
      author: tc.author,
      device_id: tc.deviceId || null,
      steps: JSON.stringify(tc.steps),
      created_at: tc.createdAt,
      updated_at: tc.updatedAt,
    });
    return { success: true };
  });

  // Update a test case
  ipcMain.handle('testcase:update', async (_event, id: string, updates: Partial<TestCase>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.author !== undefined) dbUpdates.author = updates.author;
    if (updates.deviceId !== undefined) dbUpdates.device_id = updates.deviceId || null;
    if (updates.steps !== undefined) dbUpdates.steps = JSON.stringify(updates.steps);
    if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;

    if (Object.keys(dbUpdates).length > 0) {
      updateTestCase(id, dbUpdates);
    }
    return { success: true };
  });

  // Delete a test case
  ipcMain.handle('testcase:delete', async (_event, id: string) => {
    deleteTestCase(id);
    return { success: true };
  });

  // Execute a test case
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

  // Recording functionality
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
