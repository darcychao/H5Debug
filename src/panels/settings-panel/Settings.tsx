import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Input from '../../components/pixel-ui/Input';
import Toggle from '../../components/pixel-ui/Toggle';
import Select from '../../components/pixel-ui/Select';
import Button from '../../components/pixel-ui/Button';
import { useTheme, ColorTheme, DesignStyle } from '../../hooks/useTheme';

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colorTheme, designStyle, setColorTheme, setDesignStyle } = useTheme();

  const colorThemeOptions = [
    { value: 'dark' as ColorTheme, label: t('settings.themeDark') },
    { value: 'light' as ColorTheme, label: t('settings.themeLight') },
    { value: 'blue' as ColorTheme, label: t('settings.themeBlue') },
    { value: 'yellow' as ColorTheme, label: t('settings.themeYellow') },
  ];

  const designStyleOptions = [
    { value: 'pixel' as DesignStyle, label: t('settings.stylePixel') },
    { value: 'modern' as DesignStyle, label: t('settings.styleModern') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <Card title={t('settings.appearance')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <Select
            label={t('settings.language')}
            value={i18n.language}
            options={[
              { value: 'en', label: 'English' },
              { value: 'zh-CN', label: '简体中文' },
            ]}
            onChange={(v) => i18n.changeLanguage(v as string)}
          />
          <Select
            label={t('settings.colorTheme')}
            value={colorTheme}
            options={colorThemeOptions}
            onChange={(v) => setColorTheme(v as ColorTheme)}
          />
          <Select
            label={t('settings.designStyle')}
            value={designStyle}
            options={designStyleOptions}
            onChange={(v) => setDesignStyle(v as DesignStyle)}
          />
        </div>
      </Card>

      <Card title={t('settings.device')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <Input label={t('settings.adbPath')} defaultValue="adb" />
          <Input label={t('settings.hdcPath')} defaultValue="hdc" />
          <Toggle label={t('settings.autoConnect')} checked={true} onChange={() => {}} />
        </div>
      </Card>

      <Card title={t('settings.screencast')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <Select
            label={t('settings.format')}
            options={[
              { value: 'jpeg', label: 'JPEG' },
              { value: 'png', label: 'PNG' },
            ]}
          />
          <Input label={t('settings.quality')} type="number" defaultValue="80" />
          <Input label={t('settings.maxFps')} type="number" defaultValue="30" />
        </div>
      </Card>

      <Card title={t('settings.testCase')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <Input label={t('settings.reportDir')} defaultValue="./reports" />
          <Input label={t('settings.recordingDir')} defaultValue="./recordings" />
          <Toggle label={t('settings.autoScreenshotOnFail')} checked={true} onChange={() => {}} />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
        <Button variant="secondary">{t('settings.reset')}</Button>
        <Button variant="primary">{t('settings.save')}</Button>
      </div>
    </div>
  );
};

export default Settings;
