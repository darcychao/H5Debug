import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';
import chokidar from 'chokidar';

export class ConfigManager extends EventEmitter {
  private configPath: string;
  private config: Record<string, unknown> = {};
  private watcher: chokidar.FSWatcher | null = null;

  constructor(configPath: string = './config/app.yaml') {
    super();
    this.configPath = configPath;
    this.load();
  }

  load(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        this.config = yaml.load(content) as Record<string, unknown>;
      } else {
        this.config = this.getDefaults();
        this.save();
      }
    } catch (err) {
      console.error('Failed to load config:', err);
      this.config = this.getDefaults();
    }
  }

  save(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const content = yaml.dump(this.config, { indent: 2, lineWidth: 120 });
      fs.writeFileSync(this.configPath, content, 'utf-8');
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  }

  get(key: string): unknown {
    const keys = key.split('.');
    let value: unknown = this.config;
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return value;
  }

  getAll(): Record<string, unknown> {
    return { ...this.config };
  }

  set(key: string, value: unknown): void {
    const keys = key.split('.');
    let obj: Record<string, unknown> = this.config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in obj) || typeof obj[keys[i]] !== 'object') {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]] as Record<string, unknown>;
    }
    obj[keys[keys.length - 1]] = value;
    this.save();
    this.emit('changed', { key, value });
  }

  watch(): void {
    if (this.watcher) return;
    this.watcher = chokidar.watch(this.configPath, {
      ignoreInitial: true,
    });
    this.watcher.on('change', () => {
      this.load();
      this.emit('changed', this.config);
    });
  }

  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  private getDefaults(): Record<string, unknown> {
    return {
      app: { theme: 'dark', language: 'zh-CN' },
      device: {
        adb_path: 'adb',
        hdc_path: 'hdc',
        cdp_port_range: [9222, 9322],
        auto_connect: true,
      },
      screencast: { quality: 80, max_fps: 30, format: 'jpeg' },
      network: { max_record_count: 5000, auto_enable_intercept: false },
      testcase: {
        report_dir: './reports',
        recording_dir: './recordings',
        auto_screenshot_on_fail: true,
      },
      console: { max_history: 100 },
      plugin: { plugin_dir: './plugins' },
    };
  }
}
