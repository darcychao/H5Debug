import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';

const PackageList: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Card title={t('package.title')} className="package-list-card">
      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
        {t('package.noDevice')}
      </div>
    </Card>
  );
};

export default PackageList;
