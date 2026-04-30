import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import Input from '../../components/pixel-ui/Input';
import Select from '../../components/pixel-ui/Select';
import Modal from '../../components/pixel-ui/Modal';

interface ProxyRule {
  id: string;
  name: string;
  deviceType: 'adb' | 'hdc';
  localPort: number;
  remotePort: number;
  type: 'forward' | 'reverse';
  enabled: boolean;
}

const ProxyRuleList: React.FC = () => {
  const { t } = useTranslation();
  const [rules, setRules] = useState<ProxyRule[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<ProxyRule | null>(null);

  const handleAdd = () => {
    setEditing({
      id: crypto.randomUUID(),
      name: '',
      deviceType: 'adb',
      localPort: 8080,
      remotePort: 8080,
      type: 'reverse',
      enabled: true,
    });
    setShowEditor(true);
  };

  const handleEdit = (rule: ProxyRule) => {
    setEditing({ ...rule });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!editing) return;
    const existing = rules.find((r) => r.id === editing.id);
    if (existing) {
      setRules(rules.map((r) => (r.id === editing.id ? editing : r)));
    } else {
      setRules([...rules, editing]);
    }
    setShowEditor(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleToggle = (id: string) => {
    setRules(rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleApply = async (rule: ProxyRule) => {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.invoke('portproxy:crud', rule.type, {
        id: rule.id,
        deviceType: rule.deviceType,
        localPort: rule.localPort,
        remotePort: rule.remotePort,
      });
    } catch (err) {
      console.error('Failed to apply proxy rule:', err);
    }
  };

  return (
    <>
      <Card
        title={t('proxy.title')}
        headerActions={<Button size="sm" variant="primary" onClick={handleAdd}>{t('proxy.addRule')}</Button>}
      >
        {rules.map((rule) => (
          <div
            key={rule.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              padding: '2px 0',
              fontSize: 'var(--font-size-xs)',
              borderBottom: '1px solid var(--color-border)',
              opacity: rule.enabled ? 1 : 0.5,
            }}
          >
            <span style={{ fontWeight: 600, color: rule.type === 'forward' ? 'var(--color-info)' : 'var(--color-accent)', minWidth: 50 }}>
              {rule.type === 'forward' ? 'FWD' : 'REV'}
            </span>
            <span style={{ flex: 1 }}>
              {rule.name || `tcp:${rule.localPort} → tcp:${rule.remotePort}`}
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>{rule.deviceType.toUpperCase()}</span>
            <Button size="sm" variant="ghost" onClick={() => handleToggle(rule.id)}>
              {rule.enabled ? 'ON' : 'OFF'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleApply(rule)} disabled={!rule.enabled}>
              {t('proxy.apply') || 'Apply'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleEdit(rule)}>
              {t('network.edit')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(rule.id)}>
              {t('network.del')}
            </Button>
          </div>
        ))}
        {rules.length === 0 && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            {t('proxy.noRules')}
          </div>
        )}
      </Card>

      <Modal
        open={showEditor}
        onClose={() => { setShowEditor(false); setEditing(null); }}
        title={t('proxy.ruleEditor') || 'Proxy Rule'}
        footer={<Button variant="primary" onClick={handleSave}>{t('network.save')}</Button>}
      >
        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <Input
              label={t('proxy.ruleName') || 'Rule Name'}
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: (e.target as HTMLInputElement).value })}
              placeholder={t('proxy.ruleNamePlaceholder') || 'e.g. Dev Server Proxy'}
            />
            <Select
              label={t('proxy.type') || 'Type'}
              value={editing.type}
              options={[
                { value: 'reverse', label: t('proxy.reverse') || 'Reverse (device → local)' },
                { value: 'forward', label: t('proxy.forward') || 'Forward (local → device)' },
              ]}
              onChange={(v) => setEditing({ ...editing, type: v as 'forward' | 'reverse' })}
            />
            <Select
              label={t('proxy.deviceType') || 'Device Type'}
              value={editing.deviceType}
              options={[
                { value: 'adb', label: 'ADB' },
                { value: 'hdc', label: 'HDC' },
              ]}
              onChange={(v) => setEditing({ ...editing, deviceType: v as 'adb' | 'hdc' })}
            />
            <Input
              label={t('proxy.localPort') || 'Local Port'}
              type="number"
              value={String(editing.localPort)}
              onChange={(e) => setEditing({ ...editing, localPort: parseInt((e.target as HTMLInputElement).value) || 0 })}
            />
            <Input
              label={t('proxy.remotePort') || 'Remote Port'}
              type="number"
              value={String(editing.remotePort)}
              onChange={(e) => setEditing({ ...editing, remotePort: parseInt((e.target as HTMLInputElement).value) || 0 })}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default ProxyRuleList;
