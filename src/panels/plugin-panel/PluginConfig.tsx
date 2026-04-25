import React from 'react';
import Card from '../../components/pixel-ui/Card';
import Input from '../../components/pixel-ui/Input';
import Button from '../../components/pixel-ui/Button';

interface PluginConfigProps {
  pluginId: string | null;
}

const PluginConfig: React.FC<PluginConfigProps> = ({ pluginId }) => {
  if (!pluginId) {
    return (
      <Card title="Plugin Config">
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          Select a plugin to configure
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Config: ${pluginId}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        <Input label="Plugin-specific config" placeholder="No configuration available" disabled />
        <Button size="sm" variant="primary">Save</Button>
      </div>
    </Card>
  );
};

export default PluginConfig;
