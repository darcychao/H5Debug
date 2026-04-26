import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../components/pixel-ui/Button';
import Input from '../../components/pixel-ui/Input';

const PackageActions: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end', flexShrink: 0 }}>
      <Input placeholder={t('package.placeholder')} style={{ flex: 1 }} />
      <Button size="sm" variant="primary">{t('package.install')}</Button>
      <Button size="sm" variant="danger">{t('package.uninstall')}</Button>
      <Button size="sm" variant="secondary">{t('package.clearCache')}</Button>
    </div>
  );
};

export default PackageActions;
