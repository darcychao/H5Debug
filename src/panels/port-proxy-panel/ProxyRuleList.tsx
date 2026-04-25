import React from 'react';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';

const ProxyRuleList: React.FC = () => {
  return (
    <Card
      title="Port Proxy"
      headerActions={<Button size="sm" variant="primary">Add Rule</Button>}
    >
      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
        No proxy rules configured
      </div>
    </Card>
  );
};

export default ProxyRuleList;
