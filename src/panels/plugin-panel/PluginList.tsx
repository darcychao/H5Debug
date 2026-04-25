import React, { useState, useEffect } from 'react';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import Toggle from '../../components/pixel-ui/Toggle';

interface PluginInfo {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  description: string;
}

const PluginList: React.FC = () => {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);

  const fetchPlugins = async () => {
    if (!window.electronAPI) return;
    try {
      const list = (await window.electronAPI.invoke('plugin:crud', 'list', {})) as PluginInfo[];
      if (list) setPlugins(list);
    } catch (err) {
      console.error('Failed to fetch plugins:', err);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    if (!window.electronAPI) return;
    await window.electronAPI.invoke('plugin:crud', enabled ? 'enable' : 'disable', { id });
    fetchPlugins();
  };

  const handleUninstall = async (id: string) => {
    if (!window.electronAPI) return;
    await window.electronAPI.invoke('plugin:crud', 'uninstall', { id });
    fetchPlugins();
  };

  return (
    <Card title="Plugins">
      {plugins.map((plugin) => (
        <div key={plugin.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-xs) 0', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)' }}>
          <Toggle checked={plugin.enabled} onChange={(v) => handleToggle(plugin.id, v)} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{plugin.name} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>v{plugin.version}</span></div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>{plugin.description}</div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => handleUninstall(plugin.id)}>Uninstall</Button>
        </div>
      ))}
      {plugins.length === 0 && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          No plugins installed
        </div>
      )}
    </Card>
  );
};

export default PluginList;
