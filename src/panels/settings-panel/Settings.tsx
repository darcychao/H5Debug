import React from 'react';
import Card from '../../components/pixel-ui/Card';
import Input from '../../components/pixel-ui/Input';
import Toggle from '../../components/pixel-ui/Toggle';
import Select from '../../components/pixel-ui/Select';
import Button from '../../components/pixel-ui/Button';

const Settings: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <Card title="Device">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <Input label="ADB Path" defaultValue="adb" />
          <Input label="HDC Path" defaultValue="hdc" />
          <Toggle label="Auto Connect" checked={true} onChange={() => {}} />
        </div>
      </Card>

      <Card title="Screencast">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <Select
            label="Format"
            options={[
              { value: 'jpeg', label: 'JPEG' },
              { value: 'png', label: 'PNG' },
            ]}
          />
          <Input label="Quality (1-100)" type="number" defaultValue="80" />
          <Input label="Max FPS" type="number" defaultValue="30" />
        </div>
      </Card>

      <Card title="Test Case">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <Input label="Report Dir" defaultValue="./reports" />
          <Input label="Recording Dir" defaultValue="./recordings" />
          <Toggle label="Auto Screenshot on Fail" checked={true} onChange={() => {}} />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
        <Button variant="secondary">Reset</Button>
        <Button variant="primary">Save</Button>
      </div>
    </div>
  );
};

export default Settings;
