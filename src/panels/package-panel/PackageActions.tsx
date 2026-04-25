import React from 'react';
import Button from '../../components/pixel-ui/Button';
import Input from '../../components/pixel-ui/Input';

const PackageActions: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end', flexShrink: 0 }}>
      <Input placeholder="Package name or path..." style={{ flex: 1 }} />
      <Button size="sm" variant="primary">Install</Button>
      <Button size="sm" variant="danger">Uninstall</Button>
      <Button size="sm" variant="secondary">Clear Cache</Button>
    </div>
  );
};

export default PackageActions;
