import { EventEmitter } from 'events';
import { H5DebugPlugin, PluginContext } from './plugin-interface';
import { CdpClient } from '../cdp/cdp-client';
import { DeviceInfo } from '../device/device-manager';

interface PluginEntry {
  plugin: H5DebugPlugin;
  enabled: boolean;
  installed: boolean;
  context?: PluginContext;
}

export class PluginManager extends EventEmitter {
  private plugins: Map<string, PluginEntry> = new Map();
  private pluginConfigs: Map<string, Record<string, unknown>> = new Map();

  async install(plugin: H5DebugPlugin, context?: PluginContext): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} already installed`);
    }

    this.plugins.set(plugin.id, {
      plugin,
      enabled: true,
      installed: true,
      context,
    });

    if (context) {
      plugin.install(context);
    }

    this.emit('plugin:installed', plugin);
  }

  async uninstall(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId);
    if (!entry) return;

    entry.plugin.uninstall();
    this.plugins.delete(pluginId);
    this.emit('plugin:uninstalled', pluginId);
  }

  enable(pluginId: string): void {
    const entry = this.plugins.get(pluginId);
    if (entry) {
      entry.enabled = true;
      this.emit('plugin:enabled', pluginId);
    }
  }

  disable(pluginId: string): void {
    const entry = this.plugins.get(pluginId);
    if (entry) {
      entry.enabled = false;
      this.emit('plugin:disabled', pluginId);
    }
  }

  getPlugin(pluginId: string): H5DebugPlugin | undefined {
    return this.plugins.get(pluginId)?.plugin;
  }

  listPlugins(): Array<{ id: string; name: string; version: string; enabled: boolean; description: string }> {
    return Array.from(this.plugins.values()).map((entry) => ({
      id: entry.plugin.id,
      name: entry.plugin.name,
      version: entry.plugin.version,
      enabled: entry.enabled,
      description: entry.plugin.description,
    }));
  }

  async runBeforeStepExecute(step: any, context?: PluginContext): Promise<any> {
    let modifiedStep = step;
    for (const entry of this.plugins.values()) {
      if (!entry.enabled || !entry.plugin.hooks.beforeStepExecute) continue;
      try {
        const result = await entry.plugin.hooks.beforeStepExecute(modifiedStep, context || entry.context!);
        if (result) modifiedStep = result;
      } catch (err) {
        console.error(`Plugin ${entry.plugin.id} beforeStepExecute error:`, err);
      }
    }
    return modifiedStep;
  }

  async runAfterStepExecute(step: any, result: any, context?: PluginContext): Promise<void> {
    for (const entry of this.plugins.values()) {
      if (!entry.enabled || !entry.plugin.hooks.afterStepExecute) continue;
      try {
        await entry.plugin.hooks.afterStepExecute(step, result, context || entry.context!);
      } catch (err) {
        console.error(`Plugin ${entry.plugin.id} afterStepExecute error:`, err);
      }
    }
  }

  async runOnInputIntercept(step: any, inputValue: string): Promise<string> {
    let value = inputValue;
    for (const entry of this.plugins.values()) {
      if (!entry.enabled || !entry.plugin.hooks.onInputIntercept) continue;
      try {
        value = await entry.plugin.hooks.onInputIntercept(step, value);
      } catch (err) {
        console.error(`Plugin ${entry.plugin.id} onInputIntercept error:`, err);
      }
    }
    return value;
  }
}
