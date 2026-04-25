import React, { useState } from 'react';
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

const ProxyRuleEditor: React.FC = () => {
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

  return (
    <>
      <Card
        title="Port Proxy Rules"
        headerActions={<Button size="sm" variant="primary" onClick={handleAdd}>+ Add</Button>}
      >
        {rules.map((rule) => (
          <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: '2px 0', fontSize: 'var(--font-size-xs)', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-accent)', minWidth: 40 }}>{rule.type}</span>
            <span style={{ flex: 1 }}>
              {rule.name || `tcp:${rule.localPort} → tcp:${rule.remotePort}`}
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>{rule.deviceType.toUpperCase()}</span>
            <Button size="sm" variant="ghost" onClick={() => { setEditing({ ...rule }); setShowEditor(true); }}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(rule.id)}>Del</Button>
          </div>
        ))}
        {rules.length === 0 && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            No proxy rules configured. Add one to enable port forwarding/reverse proxy.
          </div>
        )}
      </Card>

      <Modal open={showEditor} onClose={() => { setShowEditor(false); setEditing(null); }} title="Proxy Rule" footer={<Button variant="primary" onClick={handleSave}>Save</Button>}>
        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <Input label="Rule Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: (e.target as HTMLInputElement).value })} />
            <Select
              label="Type"
              value={editing.type}
              options={[
                { value: 'forward', label: 'Forward (local → device)' },
                { value: 'reverse', label: 'Reverse (device → local)' },
              ]}
              onChange={(v) => setEditing({ ...editing, type: v as 'forward' | 'reverse' })}
            />
            <Select
              label="Device Type"
              value={editing.deviceType}
              options={[
                { value: 'adb', label: 'ADB' },
                { value: 'hdc', label: 'HDC' },
              ]}
              onChange={(v) => setEditing({ ...editing, deviceType: v as 'adb' | 'hdc' })}
            />
            <Input label="Local Port" type="number" value={String(editing.localPort)} onChange={(e) => setEditing({ ...editing, localPort: parseInt((e.target as HTMLInputElement).value) || 0 })} />
            <Input label="Remote Port" type="number" value={String(editing.remotePort)} onChange={(e) => setEditing({ ...editing, remotePort: parseInt((e.target as HTMLInputElement).value) || 0 })} />
          </div>
        )}
      </Modal>
    </>
  );
};

export default ProxyRuleEditor;
