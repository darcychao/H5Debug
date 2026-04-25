import React from 'react';
import Card from '../../components/pixel-ui/Card';

const PackageList: React.FC = () => {
  return (
    <Card title="Packages" className="package-list-card">
      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
        Connect a device to view packages
      </div>
    </Card>
  );
};

export default PackageList;
