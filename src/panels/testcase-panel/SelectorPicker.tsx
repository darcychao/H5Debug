import React, { useState } from 'react';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import Input from '../../components/pixel-ui/Input';
import Select from '../../components/pixel-ui/Select';
import { useTranslation } from 'react-i18next';

interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
  text: string;
  hasId?: boolean;
  hasClass?: boolean;
  path?: string;
}

interface SelectorResult {
  tagName: string;
  classSelector: string;
  idSelector: string;
  cssSelector: string;
  xpathSelector: string;
  pathSelector: string;
  text: string;
  attributes: string[];
  nodeId: number;
  hasId: boolean;
  hasClass: boolean;
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
  const [selectorType, setSelectorType] = useState<'css' | 'id' | 'xpath' | 'path'>('css');
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const fetchDom = async () => {
    if (!deviceId || !window.electronAPI) return;
    setLoading(true);
    try {
      const result: any = await window.electronAPI.invoke('cdp:dom:getElements', deviceId);
      if (result?.result?.value) {
        const elements: ElementInfo[] = result.result.value;
        setSelectors(elements.map((el, idx) => {
          const classStr = String(el.className || '');
          const classAttr = classStr.split(/\s+/).filter(Boolean)[0] || '';
          const idAttr = el.id || '';
          const tagName = el.tagName?.toLowerCase() || '';
          const text = el.text || '';
          const classSel = classAttr ? `.${classAttr}` : '';
          const idSel = idAttr ? `#${idAttr}` : '';
          const cssSel = idAttr ? `#${idAttr}` : classAttr ? `${tagName}.${classAttr}` : tagName;
          const xpathSel = `//${tagName}${idAttr ? `[@id="${idAttr}"]` : classAttr ? `[@class="${classAttr}"]` : ''}`;
          const pathSel = el.path || cssSel;

          return {
            tagName,
            classSelector: classSel || tagName,
            idSelector: idSel || tagName,
            cssSelector: cssSel,
            xpathSelector: xpathSel,
            pathSelector: pathSel,
            text,
            attributes: idAttr ? ['id', idAttr, 'class', el.className] : el.className ? ['class', el.className] : [],
            nodeId: idx,
            hasId: el.hasId || !!idAttr,
            hasClass: el.hasClass || !!classAttr,
          };
        }));
      }
    } catch (err) {
      console.error('Failed to get DOM:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSelector = (s: SelectorResult): string => {
    if (selectorType === 'id' && s.hasId) return s.idSelector;
    if (selectorType === 'xpath') return s.xpathSelector;
    if (selectorType === 'path') return s.pathSelector;
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
            { value: 'path', label: 'Path' },
          ]}
          onChange={(v) => setSelectorType(v as 'css' | 'id' | 'xpath' | 'path')}
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
