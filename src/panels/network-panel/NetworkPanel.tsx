import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import Input from '../../components/pixel-ui/Input';
import Toggle from '../../components/pixel-ui/Toggle';
import Select from '../../components/pixel-ui/Select';
import Tabs from '../../components/pixel-ui/Tabs';
import Modal from '../../components/pixel-ui/Modal';
import { useNetworkStore, InterceptRule } from '../../stores/network.store';
import './NetworkPanel.css';

const NetworkPanel: React.FC = () => {
  const { t } = useTranslation();
  const {
    requests,
    responses,
    interceptEnabled,
    interceptRules,
    selectedRequestId,
    filterText,
    addRequest,
    addResponse,
    setInterceptEnabled,
    setInterceptRules,
    setSelectedRequestId,
    setFilterText,
    clearRequests,
  } = useNetworkStore();

  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<InterceptRule | null>(null);

  // Load initial state from backend
  useEffect(() => {
    if (window.electronAPI) {
      // Get current intercept enabled state
      window.electronAPI.invoke('network:intercept:get-enabled').then((enabled) => {
        setInterceptEnabled(enabled);
      }).catch(() => {});

      // Get current intercept rules
      window.electronAPI.invoke('network:intercept:get-rules').then((rules) => {
        if (rules && rules.length > 0) {
          setInterceptRules(rules);
        }
      }).catch(() => {});
    }
  }, [setInterceptEnabled, setInterceptRules]);

  // Listen for network events
  useEffect(() => {
    if (!window.electronAPI) return;

    const removeRequestListener = window.electronAPI.on('cdp:network:request', (data: any) => {
      if (data?.request) {
        addRequest(data.request);
      }
    });

    const removeResponseListener = window.electronAPI.on('cdp:network:response', (data: any) => {
      if (data?.response) {
        addResponse(data.response);
      }
    });

    const removeResponseBodyListener = window.electronAPI.on('cdp:network:response-body', (data: any) => {
      if (data?.response) {
        addResponse(data.response);
      }
    });

    return () => {
      removeRequestListener?.();
      removeResponseListener?.();
      removeResponseBodyListener?.();
    };
  }, [addRequest, addResponse]);

  const handleToggleIntercept = async (enabled: boolean) => {
    setInterceptEnabled(enabled);
    if (window.electronAPI) {
      await window.electronAPI.invoke('network:intercept:set-enabled', enabled);
    }
  };

  const handleSaveRule = async (rule: InterceptRule) => {
    const existingIndex = interceptRules.findIndex((r) => r.id === rule.id);
    let newRules;
    if (existingIndex >= 0) {
      newRules = [...interceptRules];
      newRules[existingIndex] = rule;
    } else {
      newRules = [...interceptRules, rule];
    }
    setInterceptRules(newRules);
    if (window.electronAPI) {
      await window.electronAPI.invoke('network:intercept:set-rules', newRules);
    }
    setShowRuleEditor(false);
    setEditingRule(null);
  };

  const handleDeleteRule = async (ruleId: string) => {
    const newRules = interceptRules.filter((r) => r.id !== ruleId);
    setInterceptRules(newRules);
    if (window.electronAPI) {
      await window.electronAPI.invoke('network:intercept:set-rules', newRules);
    }
  };

  const filteredRequests = requests.filter((r) =>
    filterText ? r.url.toLowerCase().includes(filterText.toLowerCase()) : true,
  );

  const selectedRequest = requests.find((r) => r && r.id === selectedRequestId);
  const selectedResponse = selectedRequestId ? responses.get(selectedRequestId) : null;

  return (
    <div className="network-panel">
      <div className="network-toolbar">
        <Toggle
          label={t('network.intercept')}
          checked={interceptEnabled}
          onChange={handleToggleIntercept}
        />
        <Input
          placeholder={t('network.filterPlaceholder')}
          value={filterText}
          onChange={(e) => setFilterText((e.target as HTMLInputElement).value)}
          style={{ flex: 1 }}
        />
        <Button size="sm" variant="secondary" onClick={() => {
          const newRule: InterceptRule = {
            id: crypto.randomUUID(),
            name: '',
            urlPattern: '',
            action: 'block',
            enabled: true,
          };
          setEditingRule(newRule);
          setShowRuleEditor(true);
        }}>
          {t('network.addRule')}
        </Button>
        <Button size="sm" variant="ghost" onClick={clearRequests}>
          {t('network.clear')}
        </Button>
      </div>

      <div className="network-content">
        <div className="network-list">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`network-request-item ${req.id === selectedRequestId ? 'network-request-item--active' : ''}`}
              onClick={() => setSelectedRequestId(req.id)}
            >
              <span className="network-method" data-method={req.method}>{req.method}</span>
              <span className="network-url">{req.url}</span>
              <span className="network-type">{req.resourceType}</span>
              <span className="network-time">{new Date(req.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
          {filteredRequests.length === 0 && (
            <div className="network-empty">{t('network.noRequests')}</div>
          )}
        </div>

        {selectedRequest && (
          <div className="network-detail">
            <Tabs
              items={[
                {
                  key: 'headers',
                  label: t('network.headers'),
                  content: (
                    <pre className="network-json">
                      {JSON.stringify(selectedRequest.headers, null, 2)}
                    </pre>
                  ),
                },
                {
                  key: 'body',
                  label: t('network.body'),
                  content: (
                    <pre className="network-json">
                      {selectedRequest.postData || t('network.noBody')}
                    </pre>
                  ),
                },
                {
                  key: 'response',
                  label: t('network.response'),
                  content: (
                    <pre className="network-json">
                      {selectedResponse
                        ? JSON.stringify({ status: selectedResponse.status, headers: selectedResponse.headers, body: selectedResponse.body }, null, 2)
                        : t('network.pending')}
                    </pre>
                  ),
                },
              ]}
            />
          </div>
        )}
      </div>

      {/* Intercept Rules Section */}
      {interceptRules.length > 0 && (
        <div className="network-rules">
          <div className="network-rules-header">{t('network.interceptRules')}</div>
          {interceptRules.map((rule) => (
            <div key={rule.id} className="network-rule-item">
              <Toggle
                checked={rule.enabled}
                onChange={(v) => {
                  const newRules = interceptRules.map((r) => r.id === rule.id ? { ...r, enabled: v } : r);
                  setInterceptRules(newRules);
                  window.electronAPI?.invoke('network:intercept:set-rules', newRules);
                }}
              />
              <span className={`network-rule-action network-rule-action--${rule.action}`}>{rule.action}</span>
              <span className="network-rule-pattern">{rule.name || rule.urlPattern}</span>
              <Button size="sm" variant="ghost" onClick={() => { setEditingRule(rule); setShowRuleEditor(true); }}>
                {t('network.edit')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDeleteRule(rule.id)}>
                {t('network.del')}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showRuleEditor}
        onClose={() => { setShowRuleEditor(false); setEditingRule(null); }}
        title={editingRule?.id && interceptRules.some((r) => r.id === editingRule.id) ? t('network.editRule') : t('network.newRule')}
        footer={
          editingRule ? (
            <Button variant="primary" onClick={() => handleSaveRule(editingRule)}>
              {t('network.save')}
            </Button>
          ) : null
        }
      >
        {editingRule && (
          <InterceptRuleEditor rule={editingRule} onChange={setEditingRule} />
        )}
      </Modal>
    </div>
  );
};

const InterceptRuleEditor: React.FC<{
  rule: InterceptRule;
  onChange: (rule: InterceptRule) => void;
}> = ({ rule, onChange }) => {
  const { t } = useTranslation();
  const update = (updates: Partial<InterceptRule>) => {
    onChange({ ...rule, ...updates });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <Input label={t('network.ruleName')} value={rule.name} onChange={(e) => update({ name: (e.target as HTMLInputElement).value })} />
      <Input label={t('network.urlPattern')} value={rule.urlPattern} onChange={(e) => update({ urlPattern: (e.target as HTMLInputElement).value })} placeholder="* or regex pattern" />
      <Select
        label={t('network.action')}
        value={rule.action}
        options={[
          { value: 'block', label: t('network.block') },
          { value: 'modify', label: t('network.modify') },
          { value: 'mock', label: t('network.mock') },
        ]}
        onChange={(v) => update({ action: v as 'block' | 'modify' | 'mock' })}
      />
      {rule.action === 'mock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
          <Input label={t('network.statusCode')} type="number" value={String(rule.mockResponse?.statusCode || 200)} onChange={(e) => update({ mockResponse: { ...rule.mockResponse!, statusCode: parseInt((e.target as HTMLInputElement).value) || 200, body: rule.mockResponse?.body || '' } })} />
          <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{t('network.responseBody')}</label>
          <textarea
            className="mock-body-editor"
            value={rule.mockResponse?.body || ''}
            onChange={(e) => update({ mockResponse: { ...rule.mockResponse!, statusCode: rule.mockResponse?.statusCode || 200, body: e.target.value } })}
            placeholder="Enter response body (JSON, HTML, etc.)"
            rows={6}
          />
        </div>
      )}
      {rule.action === 'modify' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
          <Input label="New URL (optional)" value={rule.modifications?.url || ''} onChange={(e) => update({ modifications: { ...rule.modifications!, url: (e.target as HTMLInputElement).value } })} />
          <Input label="New Method (optional)" value={rule.modifications?.method || ''} onChange={(e) => update({ modifications: { ...rule.modifications!, method: (e.target as HTMLInputElement).value } })} />
        </div>
      )}
    </div>
  );
};

export default NetworkPanel;
