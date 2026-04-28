import { app, BrowserWindow } from 'electron';
import path from 'path';
import { DeviceManager } from './services/device/device-manager';
import { CdpPool } from './services/cdp/cdp-pool';
import { TestEngine } from './services/testcase/engine';
import { Recorder } from './services/testcase/recorder';
import { ReportGenerator } from './services/testcase/report-generator';
import { PackageManager } from './services/package/package-manager';
import { ConfigManager } from './services/config/config-manager';
import { PluginManager } from './services/plugin/plugin-manager';
import { CaptchaPlugin } from './plugins/captcha/index';
import { AdbService } from './services/device/adb.service';
import { HdcService } from './services/device/hdc.service';
import { registerDeviceIpc } from './ipc/device.ipc';
import { registerCdpIpc } from './ipc/cdp.ipc';
import { registerPackageIpc } from './ipc/package.ipc';
import { registerTestcaseIpc } from './ipc/testcase.ipc';
import { registerLogIpc } from './ipc/log.ipc';
import { registerConfigIpc } from './ipc/config.ipc';
import { registerPluginIpc } from './ipc/plugin.ipc';
import { registerNetworkIpc } from './ipc/network.ipc';
import { registerPortProxyIpc } from './ipc/portproxy.ipc';
import { initDatabase, closeDatabase } from './db/database';

let mainWindow: BrowserWindow | null = null;

// Initialize services
const configManager = new ConfigManager(
  path.join(process.cwd(), 'config', 'app.yaml'),
);

const adbPath = (configManager.get('device.adb_path') as string) || 'adb';
const hdcPath = (configManager.get('device.hdc_path') as string) || 'hdc';
const portRange = (configManager.get('device.cdp_port_range') as [number, number]) || [9222, 9322];

const deviceManager = new DeviceManager(adbPath, hdcPath, portRange);
const cdpPool = new CdpPool();

// Expose deviceManager globally for reconnect logic in IPC handlers
(global as any).__deviceManager = deviceManager;
const adbService = new AdbService(adbPath);
const hdcService = new HdcService(hdcPath);
const packageManager = new PackageManager(adbService, hdcService);
const testEngine = new TestEngine(cdpPool);
const recorder = new Recorder();
const reportDir = (configManager.get('testcase.report_dir') as string) || './reports';
const reportGenerator = new ReportGenerator(reportDir);
const pluginManager = new PluginManager();

// Install built-in plugins
const captchaPlugin = new CaptchaPlugin();
pluginManager.install(captchaPlugin).catch(console.error);

// Watch config for hot-reload
configManager.watch();
configManager.on('changed', (data: unknown) => {
  if (mainWindow) {
    mainWindow.webContents.send('config:changed', data);
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'H5Debug',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    frame: true,
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Register IPC handlers
  registerDeviceIpc(deviceManager, cdpPool, mainWindow);
  registerCdpIpc(cdpPool, mainWindow);
  registerNetworkIpc(cdpPool, mainWindow);
  registerPackageIpc(packageManager);
  registerTestcaseIpc(testEngine, recorder, reportGenerator, cdpPool, mainWindow);
  registerLogIpc(deviceManager, mainWindow);
  registerConfigIpc(configManager);
  registerPluginIpc(pluginManager);
  registerPortProxyIpc();

  // Start device watching
  deviceManager.watchDevices();
}

app.whenReady().then(async () => {
  // Initialize database (don't block app startup)
  try {
    await initDatabase();
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  deviceManager.stopWatching();
  configManager.stopWatching();
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});
