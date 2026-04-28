import React, { useState } from 'react';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import Input from '../../components/pixel-ui/Input';
import Select from '../../components/pixel-ui/Select';
import { useTranslation } from 'react-i18next';

interface DomNode {
  nodeId: number;
  localName: string;
  attributes?: string[];
  children?: DomNode[];
  textContent?: string;
}

interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
  text: string;
}

interface SelectorResult {
  tagName: string;
  classSelector: string;
  idSelector: string;
  cssSelector: string;
  xpathSelector: string;
  text: string;
  attributes: string[];
  nodeId: number;
}

interface SelectorPickerProps {
  deviceId: string | null;
  onSelect: (selector: string) => void;
}

const SelectorPicker: React.FC<SelectorPickerProps> = ({ deviceId, onSelect }) => {
  const { t } = useTranslation();
  const [selectors, setSelectors] = useState<SelectorResult[]>([]);
  const [tagFilter, setTagFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [idFilter, setIdFilter] = useState('');
  const [textFilter, setTextFilter] = useState('');
  const [selectorType, setSelectorType] = useState<'css' | 'id' | 'xpath'>('css');
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const fetchDom = async () => {
    if (!deviceId || !window.electronAPI) return;
    setLoading(true);
    try {
      // Use Runtime.evaluate for reliable DOM access
      const result: any = await window.electronAPI.invoke('cdp:dom:getElements', deviceId);
      if (result?.result?.value) {
        const elements: ElementInfo[] = result.result.value;
        setSelectors(elements.map((el, idx) => {
          const classAttr = String(el.className || '').split(' ')[0] || '';
          const idAttr = el.id || '';
          const tagName = el.tagName?.toLowerCase() || '';
          const text = el.text || '';
          const classSel = classAttr ? `.${classAttr}` : '';
          const idSel = idAttr ? `#${idAttr}` : '';
          const cssSel = idAttr ? `#${idAttr}` : classAttr ? `${tagName}.${classAttr}` : tagName;
          const xpathSel = `//${tagName}${classAttr ? `[@class="${classAttr}"]` : ''}${idAttr ? `[@id="${idAttr}"]` : ''}`;
          return {
            tagName,
            classSelector: classSel || tagName,
            idSelector: idSel || tagName,
            cssSelector: cssSel,
            xpathSelector: xpathSel,
            text,
            attributes: el.id ? [`id`, el.id, `class`, el.className] : el.className ? [`class`, el.className] : [],
            nodeId: idx,
          };
        }));
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

    for (let i = 0; i < attrs.length; i += 2) {
      if (attrs[i] === 'id') id = attrs[i + 1];
      if (attrs[i] === 'class') classes = attrs[i + 1].split(/\s+/).filter(Boolean);
    }

    const text = (node.textContent || '').trim().slice(0, 80);
    const tagName = node.localName || '';

    if (tagName && tagName !== '#document' && tagName !== '#text') {
      const classAttr = classes[0] || '';
      const idAttr = id || '';
      const classSel = classAttr ? `.${classAttr}` : '';
      const idSel = idAttr ? `#${idAttr}` : '';
      const cssSel = idAttr ? `#${idAttr}` : classAttr ? `${tagName}.${classAttr}` : tagName;
      const xpathSel = `//${tagName}${classAttr ? `[@class="${classAttr}"]` : ''}${idAttr ? `[@id="${idAttr}"]` : ''}${text ? `[contains(text(),"${text.slice(0, 30)}")]` : ''}`;

      results.push({
        tagName,
        classSelector: classSel || tagName,
        idSelector: idSel || tagName,
        cssSelector: cssSel,
        xpathSelector: xpathSel,
        text,
        attributes: attrs,
        nodeId: node.nodeId,
      });
    }

    if (node.children) {
      for (const child of node.children) {
        extractSelectors(child, results);
      }
    }

    return results;
  };

  const getSelector = (s: SelectorResult): string => {
    if (selectorType === 'id') return s.idSelector;
    if (selectorType === 'xpath') return s.xpathSelector;
    return s.cssSelector;
  };

  const filtered = selectors.filter((s) => {
    if (tagFilter && !s.tagName.toLowerCase().includes(tagFilter.toLowerCase())) return false;
    if (classFilter && !s.classSelector.toLowerCase().includes(classFilter.toLowerCase())) return false;
    if (idFilter && !s.idSelector.toLowerCase().includes(idFilter.toLowerCase())) return false;
    if (textFilter && !s.text.toLowerCase().includes(textFilter.toLowerCase())) return false;
    return true;
  });

  const getAttr = (attrs: string[], name: string): string => {
    for (let i = 0; i < attrs.length; i += 2) {
      if (attrs[i] === name) return attrs[i + 1];
    }
    return '';
  };

  const handleUse = (idx: number) => {
    setSelectedIdx(idx);
    onSelect(getSelector(filtered[idx]));
  };

  return (
    <Card title={t('selector.title')}>
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
        <Button size="sm" variant="primary" onClick={fetchDom} disabled={!deviceId || loading}>
          {loading ? t('selector.loading') : t('selector.fetch')}
        </Button>
        <Select
          value={selectorType}
          options={[
            { value: 'css', label: 'CSS' },
            { value: 'id', label: 'ID' },
            { value: 'xpath', label: 'XPath' },
          ]}
          onChange={(v) => setSelectorType(v as 'css' | 'id' | 'xpath')}
        />
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          {t('selector.found')}: {filtered.length} / {selectors.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <Input placeholder={t('selector.tagPlaceholder')} value={tagFilter} onChange={(e) => setTagFilter((e.target as HTMLInputElement).value)} style={{ flex: 1 }} />
          <Input placeholder={t('selector.classPlaceholder')} value={classFilter} onChange={(e) => setClassFilter((e.target as HTMLInputElement).value)} style={{ flex: 1 }} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <Input placeholder={t('selector.idPlaceholder')} value={idFilter} onChange={(e) => setIdFilter((e.target as HTMLInputElement).value)} style={{ flex: 1 }} />
          <Input placeholder={t('selector.textPlaceholder')} value={textFilter} onChange={(e) => setTextFilter((e.target as HTMLInputElement).value)} style={{ flex: 1 }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: 280, overflowY: 'scroll' }}>
        {filtered.map((s, idx) => {
          const isSelected = selectedIdx === idx;
          const elemId = getAttr(s.attributes, 'id');
          const elemClass = getAttr(s.attributes, 'class');
          return (
            <div
              key={idx}
              style={{
                padding: 'var(--spacing-xs)',
                borderBottom: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-xs)',
                cursor: 'pointer',
                background: isSelected ? 'var(--color-accent)' : 'transparent',
                color: isSelected ? '#fff' : 'var(--color-text-primary)',
                borderRadius: 'var(--border-radius)',
              }}
              onClick={() => handleUse(idx)}
            >
              <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  background: isSelected ? '#fff' : 'var(--color-accent)',
                  color: isSelected ? 'var(--color-accent)' : '#fff',
                  padding: '0 4px',
                  borderRadius: '2px',
                  fontSize: '9px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {s.tagName}
                </span>
                {elemId && (
                  <span style={{ fontSize: '9px', color: isSelected ? '#fff' : 'var(--color-warning)' }}>
                    id={elemId}
                  </span>
                )}
                {elemClass && (
                  <span style={{ fontSize: '9px', color: isSelected ? '#fff' : 'var(--color-info)' }} className={isSelected ? '' : 'selector-class'}>
                    {String(elemClass || '').split(' ')[0]}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleUse(idx); }}
                  style={{ marginLeft: 'auto', fontSize: '9px', color: isSelected ? 'var(--color-accent)' : undefined }}
                >
                  {t('selector.use')}
                </Button>
              </div>
              {s.text && (
                <div style={{ fontSize: '9px', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.text}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && selectors.length > 0 && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-md)' }}>
            {t('selector.noMatch')}
          </div>
        )}
        {selectors.length === 0 && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            {t('selector.hint')}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SelectorPicker;
