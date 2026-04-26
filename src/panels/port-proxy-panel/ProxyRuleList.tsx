import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';

const ProxyRuleList: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Card
      title={t('proxy.title')}
      headerActions={<Button size="sm" variant="primary">{t('proxy.addRule')}</Button>}
    >
      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
        {t('proxy.noRules')}
      </div>
    </Card>
  );
};

export default ProxyRuleList;
