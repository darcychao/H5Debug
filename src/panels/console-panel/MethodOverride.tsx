import React, { useState } from 'react';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import Input from '../../components/pixel-ui/Input';
import Toggle from '../../components/pixel-ui/Toggle';
import Modal from '../../components/pixel-ui/Modal';
import { useConsoleStore, MethodOverride } from '../../stores/console.store';

const MethodOverride: React.FC = () => {
  const { methodOverrides, addMethodOverride, updateMethodOverride, removeMethodOverride } = useConsoleStore();
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<MethodOverride | null>(null);

  const handleSave = () => {
    if (!editing) return;
    if (editing.id && methodOverrides.find((o) => o.id === editing.id)) {
      updateMethodOverride(editing.id, editing);
    } else {
      addMethodOverride({ ...editing, id: editing.id || crypto.randomUUID(), createdAt: Date.now() });
    }
    setShowEditor(false);
    setEditing(null);
  };

  return (
    <Card
      title="Method Overrides"
      headerActions={<Button size="sm" variant="primary" onClick={() => { setEditing({ id: '', methodName: '', overrideCode: '', description: '', enabled: true, createdAt: Date.now() }); setShowEditor(true); }}>+ Add</Button>}
    >
      {methodOverrides.map((override) => (
        <div key={override.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: '2px 0', fontSize: 'var(--font-size-xs)' }}>
          <Toggle checked={override.enabled} onChange={(v) => updateMethodOverride(override.id, { enabled: v })} />
          <span style={{ fontWeight: 600, color: 'var(--color-accent-yellow)', flex: 1 }}>{override.methodName}</span>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(override); setShowEditor(true); }}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => removeMethodOverride(override.id)}>Del</Button>
        </div>
      ))}
      {methodOverrides.length === 0 && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-sm)' }}>
          No method overrides
        </div>
      )}

      <Modal open={showEditor} onClose={() => { setShowEditor(false); setEditing(null); }} title="Method Override" footer={<Button variant="primary" onClick={handleSave}>Save</Button>}>
        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <Input label="Method Name (e.g. window.fetch)" value={editing.methodName} onChange={(e) => setEditing({ ...editing, methodName: (e.target as HTMLInputElement).value })} />
            <Input label="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: (e.target as HTMLInputElement).value })} />
            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Override Code</label>
            <textarea
              className="mock-body-editor"
              value={editing.overrideCode}
              onChange={(e) => setEditing({ ...editing, overrideCode: e.target.value })}
              placeholder="window.fetch = function() { return Promise.resolve({ ok: true }); }"
              rows={6}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default MethodOverride;
