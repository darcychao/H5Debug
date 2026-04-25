import React, { useState, useEffect } from 'react';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import Input from '../../components/pixel-ui/Input';
import { useDeviceStore } from '../../stores/device.store';

interface DomNode {
  nodeId: number;
  nodeName: string;
  localName: string;
  attributes?: string[];
  children?: DomNode[];
  textContent?: string;
}

interface SelectorResult {
  classSelector: string;
  idSelector: string;
  xpathSelector: string;
  text: string;
}

interface SelectorPickerProps {
  deviceId: string | null;
  onSelect: (selector: string) => void;
}

const SelectorPicker: React.FC<SelectorPickerProps> = ({ deviceId, onSelect }) => {
  const [domTree, setDomTree] = useState<DomNode | null>(null);
  const [selectors, setSelectors] = useState<SelectorResult[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDom = async () => {
    if (!deviceId || !window.electronAPI) return;
    setLoading(true);
    try {
      const result = await window.electronAPI.invoke('cdp:dom:getDocument', deviceId);
      if (result) {
        setDomTree(result as DomNode);
        const extracted = extractSelectors(result as DomNode);
        setSelectors(extracted);
      }
    } catch (err) {
      console.error('Failed to get DOM:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractSelectors = (node: DomNode, results: SelectorResult[] = []): SelectorResult[] => {
    const attrs = node.attributes || [];
    let id = '';
    let classes: string[] = [];
    let text = '';

    for (let i = 0; i < attrs.length; i += 2) {
      if (attrs[i] === 'id') id = attrs[i + 1];
      if (attrs[i] === 'class') classes = attrs[i + 1].split(/\s+/).filter(Boolean);
    }

    if (node.textContent) {
      text = node.textContent.trim().slice(0, 50);
    }

    if (node.localName && node.localName !== '#document' && node.localName !== '#text') {
      const classSel = classes.length > 0 ? `.${classes[0]}` : '';
      const idSel = id ? `#${id}` : '';
      const xpath = `//${node.localName}${text ? `[contains(text(),'${text.slice(0, 20)}')]` : ''}`;

      if (classSel || idSel || text) {
        results.push({
          classSelector: `${node.localName}${classSel}${text ? `[text="${text}"]` : ''}`,
          idSelector: idSel || `${node.localName}${classSel}`,
          xpathSelector: xpath,
          text,
        });
      }
    }

    if (node.children) {
      for (const child of node.children) {
        extractSelectors(child, results);
      }
    }

    return results;
  };

  const filtered = selectors.filter(
    (s) =>
      !filter ||
      s.classSelector.toLowerCase().includes(filter.toLowerCase()) ||
      s.idSelector.toLowerCase().includes(filter.toLowerCase()) ||
      s.text.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <Card
      title="Element Selector"
      headerActions={
        <Button size="sm" variant="primary" onClick={fetchDom} disabled={!deviceId || loading}>
          {loading ? 'Loading...' : 'Fetch DOM'}
        </Button>
      }
    >
      <Input placeholder="Filter elements..." value={filter} onChange={(e) => setFilter((e.target as HTMLInputElement).value)} />

      <div style={{ marginTop: 'var(--spacing-sm)', maxHeight: 300, overflow: 'auto' }}>
        {filtered.map((s, idx) => (
          <div key={idx} style={{ fontSize: 'var(--font-size-xs)', padding: '2px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{s.text || '(no text)'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: 'var(--spacing-sm)' }}>
              <SelectorRow label="class" value={s.classSelector} onSelect={onSelect} />
              <SelectorRow label="id" value={s.idSelector} onSelect={onSelect} />
              <SelectorRow label="xpath" value={s.xpathSelector} onSelect={onSelect} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && selectors.length === 0 && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            Click "Fetch DOM" to load page elements
          </div>
        )}
      </div>
    </Card>
  );
};

const SelectorRow: React.FC<{ label: string; value: string; onSelect: (v: string) => void }> = ({ label, value, onSelect }) => (
  <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
    <span style={{ color: 'var(--color-text-muted)', minWidth: 40 }}>{label}:</span>
    <code style={{ flex: 1, fontSize: '10px', color: 'var(--color-accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {value}
    </code>
    <Button size="sm" variant="ghost" onClick={() => onSelect(value)}>Use</Button>
  </div>
);

export default SelectorPicker;
