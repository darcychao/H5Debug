import React, { useState } from 'react';
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
  const {
    requests,
    interceptEnabled,
    interceptRules,
    selectedRequestId,
    filterText,
    setInterceptEnabled,
    setSelectedRequestId,
    setFilterText,
    clearRequests,
    addInterceptRule,
    updateInterceptRule,
    removeInterceptRule,
  } = useNetworkStore();

  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<InterceptRule | null>(null);

  const filteredRequests = requests.filter((r) =>
    filterText ? r.url.toLowerCase().includes(filterText.toLowerCase()) : true,
  );

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);
  const selectedResponse = selectedRequestId
    ? useNetworkStore.getState().responses.get(selectedRequestId)
    : null;

  return (
    <div className="network-panel">
      <div className="network-toolbar">
        <Toggle label="Intercept" checked={interceptEnabled} onChange={setInterceptEnabled} />
        <Input
          placeholder="Filter URLs..."
          value={filterText}
          onChange={(e) => setFilterText((e.target as HTMLInputElement).value)}
          style={{ flex: 1 }}
        />
        <Button size="sm" variant="secondary" onClick={() => setShowRuleEditor(true)}>
          + Rule
        </Button>
        <Button size="sm" variant="ghost" onClick={clearRequests}>
          Clear
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
            <div className="network-empty">No network requests captured</div>
          )}
        </div>

        {selectedRequest && (
          <div className="network-detail">
            <Tabs
              items={[
                {
                  key: 'headers',
                  label: 'Headers',
                  content: (
                    <pre className="network-json">
                      {JSON.stringify(selectedRequest.headers, null, 2)}
                    </pre>
                  ),
                },
                {
                  key: 'body',
                  label: 'Body',
                  content: (
                    <pre className="network-json">
                      {selectedRequest.postData || '(no body)'}
                    </pre>
                  ),
                },
                {
                  key: 'response',
                  label: 'Response',
                  content: (
                    <pre className="network-json">
                      {selectedResponse
                        ? JSON.stringify({ status: selectedResponse.status, headers: selectedResponse.headers, body: selectedResponse.body }, null, 2)
                        : '(pending)'}
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
          <div className="network-rules-header">Intercept Rules</div>
          {interceptRules.map((rule) => (
            <div key={rule.id} className="network-rule-item">
              <Toggle
                checked={rule.enabled}
                onChange={(v) => updateInterceptRule(rule.id, { enabled: v })}
              />
              <span className={`network-rule-action network-rule-action--${rule.action}`}>{rule.action}</span>
              <span className="network-rule-pattern">{rule.name || rule.urlPattern}</span>
              <Button size="sm" variant="ghost" onClick={() => { setEditingRule(rule); setShowRuleEditor(true); }}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => removeInterceptRule(rule.id)}>
                Del
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showRuleEditor}
        onClose={() => { setShowRuleEditor(false); setEditingRule(null); }}
        title={editingRule ? 'Edit Rule' : 'New Intercept Rule'}
        footer={
          <Button
            variant="primary"
            onClick={() => {
              if (editingRule?.id) {
                updateInterceptRule(editingRule.id, editingRule);
              } else if (editingRule) {
                addInterceptRule(editingRule);
              }
              setShowRuleEditor(false);
              setEditingRule(null);
            }}
          >
            Save
          </Button>
        }
      >
        <InterceptRuleEditor
          rule={editingRule}
          onChange={setEditingRule}
        />
      </Modal>
    </div>
  );
};

const InterceptRuleEditor: React.FC<{
  rule: InterceptRule | null;
  onChange: (rule: InterceptRule) => void;
}> = ({ rule, onChange }) => {
  const current = rule || {
    id: crypto.randomUUID(),
    name: '',
    urlPattern: '',
    action: 'block' as const,
    enabled: true,
  };

  const update = (updates: Partial<InterceptRule>) => {
    onChange({ ...current, ...updates });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <Input label="Rule Name" value={current.name} onChange={(e) => update({ name: (e.target as HTMLInputElement).value })} />
      <Input label="URL Pattern (regex)" value={current.urlPattern} onChange={(e) => update({ urlPattern: (e.target as HTMLInputElement).value })} />
      <Select
        label="Action"
        value={current.action}
        options={[
          { value: 'block', label: 'Block' },
          { value: 'modify', label: 'Modify' },
          { value: 'mock', label: 'Mock' },
        ]}
        onChange={(v) => update({ action: v as InterceptRule['action'] })}
      />
      {current.action === 'mock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
          <Input label="Status Code" type="number" value={String(current.mockResponse?.statusCode || 200)} onChange={(e) => update({ mockResponse: { ...current.mockResponse!, statusCode: parseInt((e.target as HTMLInputElement).value) || 200, body: current.mockResponse?.body || '' } })} />
          <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Response Body</label>
          <textarea
            className="mock-body-editor"
            value={current.mockResponse?.body || ''}
            onChange={(e) => update({ mockResponse: { ...current.mockResponse!, statusCode: current.mockResponse?.statusCode || 200, body: e.target.value } })}
            placeholder="Enter response body (JSON, HTML, etc.)"
            rows={6}
          />
        </div>
      )}
    </div>
  );
};

export default NetworkPanel;
