import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import Input from '../../components/pixel-ui/Input';
import Select from '../../components/pixel-ui/Select';
import Modal from '../../components/pixel-ui/Modal';
import { useDeviceStore } from '../../stores/device.store';

interface ProxyRule {
  id: string;
  name: string;
  deviceType: 'adb' | 'hdc';
  localPort: number;
  remotePort: number;
  type: 'forward' | 'reverse';
  enabled: boolean;
  applied: boolean;
}

interface ProxyRuleListProps {
  deviceId: string | null;
}

const ProxyRuleList: React.FC<ProxyRuleListProps> = ({ deviceId }) => {
  const { t } = useTranslation();
  const [rules, setRules] = useState<ProxyRule[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<ProxyRule | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const devices = useDeviceStore((s) => s.devices.filter((d) => d.status === 'connected'));

  // Parse active device: "adb:serial" or "hdc:serial"
  const [activeDeviceType, activeDeviceSerial] = deviceId
    ? (deviceId.includes(':') ? deviceId.split(':') : [null, null]) as [string | null, string | null]
    : [null, null];
  const hasActiveDevice = (activeDeviceType === 'adb' || activeDeviceType === 'hdc') && !!activeDeviceSerial;

  const handleAdd = () => {
    setEditing({
      id: crypto.randomUUID(),
      name: '',
      deviceType: (activeDeviceType === 'adb' || activeDeviceType === 'hdc') ? activeDeviceType : 'adb',
      localPort: 8080,
      remotePort: 8080,
      type: 'reverse',
      enabled: true,
      applied: false,
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
      setRules(rules.map((r) => (r.id === editing.id ? { ...editing, applied: existing.applied } : r)));
    } else {
      setRules([...rules, editing]);
    }
    setShowEditor(false);
    setEditing(null);
  };

  const handleDelete = async (rule: ProxyRule) => {
    // Remove from device if applied
    if (rule.applied && hasActiveDevice && window.electronAPI) {
      try {
        await window.electronAPI.invoke('portproxy:remove', activeDeviceSerial, activeDeviceType, {
          type: rule.type,
          localPort: rule.localPort,
          remotePort: rule.remotePort,
        });
      } catch {}
    }
    setRules(rules.filter((r) => r.id !== rule.id));
  };

  const handleToggle = (id: string) => {
    setRules(rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleApply = async (rule: ProxyRule) => {
    if (!window.electronAPI || !hasActiveDevice) return;
    setApplyError(null);

    // Use the rule's deviceType, but apply to the active device
    // Check that device type matches
    if (rule.deviceType !== activeDeviceType) {
      setApplyError(t('proxy.deviceTypeMismatch') || `Rule is for ${rule.deviceType.toUpperCase()} but active device is ${(activeDeviceType || '').toUpperCase()}`);
      return;
    }

    try {
      const result = await window.electronAPI.invoke('portproxy:apply', activeDeviceSerial, activeDeviceType, {
        type: rule.type,
        localPort: rule.localPort,
        remotePort: rule.remotePort,
      }) as { success: boolean; error?: string };

      if (result?.success) {
        setRules(rules.map((r) => r.id === rule.id ? { ...r, applied: true } : r));
      } else {
        setApplyError(result?.error || t('proxy.applyFailed') || 'Failed to apply rule');
      }
    } catch (err) {
      console.error('Failed to apply proxy rule:', err);
      setApplyError(String(err));
    }
  };

  const handleRemove = async (rule: ProxyRule) => {
    if (!window.electronAPI || !hasActiveDevice) return;
    setApplyError(null);

    try {
      const result = await window.electronAPI.invoke('portproxy:remove', activeDeviceSerial, activeDeviceType, {
        type: rule.type,
        localPort: rule.localPort,
        remotePort: rule.remotePort,
      }) as { success: boolean; error?: string };

      if (result?.success) {
        setRules(rules.map((r) => r.id === rule.id ? { ...r, applied: false } : r));
      } else {
        setApplyError(result?.error || t('proxy.removeFailed') || 'Failed to remove rule');
      }
    } catch (err) {
      console.error('Failed to remove proxy rule:', err);
      setApplyError(String(err));
    }
  };

  return (
    <>
      <Card
        title={t('proxy.title')}
        headerActions={
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
            {hasActiveDevice && (
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                {(activeDeviceType || '').toUpperCase()}: {activeDeviceSerial}
              </span>
            )}
            <Button size="sm" variant="primary" onClick={handleAdd}>{t('proxy.addRule')}</Button>
          </div>
        }
      >
        {applyError && (
          <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)', padding: 'var(--spacing-xs)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--spacing-sm)' }}>
            {applyError}
          </div>
        )}

        {!hasActiveDevice && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>
            {t('proxy.noDevice') || 'Connect a device to apply proxy rules'}
          </div>
        )}

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
            {rule.applied ? (
              <Button size="sm" variant="ghost" onClick={() => handleRemove(rule)} disabled={!rule.enabled || !hasActiveDevice}>
                {t('proxy.remove') || 'Remove'}
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => handleApply(rule)} disabled={!rule.enabled || !hasActiveDevice}>
                {t('proxy.apply') || 'Apply'}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => handleEdit(rule)}>
              {t('network.edit')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(rule)}>
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
