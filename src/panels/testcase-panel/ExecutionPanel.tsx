import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import Select from '../../components/pixel-ui/Select';
import { useTestcaseStore, TestCase, TestReport } from '../../stores/testcase.store';
import { useDeviceStore } from '../../stores/device.store';

interface ExecutionPanelProps {
  testCase: TestCase | null;
  onSelectCase?: (caseId: string) => void;
}

const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ testCase, onSelectCase }) => {
  const { t } = useTranslation();
  const { testCases, executing, currentResults, setExecuting, addResult, clearResults, addReport, loadTestCases, loaded } = useTestcaseStore();
  const devices = useDeviceStore((s) => s.devices.filter((d) => d.status === 'connected'));

  // Load test cases if not loaded yet
  useEffect(() => {
    if (!loaded) {
      loadTestCases();
    }
  }, [loaded, loadTestCases]);

  const handleCaseSelect = (caseId: string) => {
    onSelectCase?.(caseId);
  };

  const handleExecute = async (deviceId?: string) => {
    if (!testCase || !window.electronAPI) return;
    setExecuting(true);
    clearResults();

    try {
      const result = await window.electronAPI.invoke('testcase:execute', testCase, deviceId);
      if (result) {
        addReport(result as TestReport);
      }
    } catch (err) {
      console.error('Execution failed:', err);
    } finally {
      setExecuting(false);
    }
  };

  const handleBatchExecute = async () => {
    if (!testCase || !window.electronAPI) return;
    setExecuting(true);
    clearResults();

    try {
      const assignments = devices.map((device, idx) => ({
        testCase: { ...testCase, id: `${testCase.id}_batch_${idx}` },
        deviceId: `${device.type}:${device.id}`,
      }));
      const results = await window.electronAPI.invoke('testcase:execute', assignments);
      if (Array.isArray(results)) {
        results.forEach((r) => addReport(r as TestReport));
      }
    } catch (err) {
      console.error('Batch execution failed:', err);
    } finally {
      setExecuting(false);
    }
  };

  const caseOptions = testCases.map((tc) => ({
    value: tc.id,
    label: tc.name || `(${t('testcase.noName')})`,
  }));

  return (
    <Card title={t('testcase.execution')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {/* Case selector dropdown */}
        <Select
          label={t('testcase.selectCase') || 'Select Case'}
          options={[{ value: '', label: `-- ${t('testcase.selectToExecute')} --` }, ...caseOptions]}
          value={testCase?.id || ''}
          onChange={(v) => v && handleCaseSelect(v)}
        />

        {testCase ? (
          <>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              {testCase.name || t('testcase.noName')} — {testCase.steps.length} {t('testcase.steps')}
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
              {devices.length > 0 && (
                <Button size="sm" variant="primary" onClick={() => handleExecute(`${devices[0].type}:${devices[0].id}`)} disabled={executing}>
                  {executing ? t('testcase.running') : t('testcase.execute')}
                </Button>
              )}
              {devices.length > 1 && (
                <Button size="sm" variant="secondary" onClick={handleBatchExecute} disabled={executing}>
                  {t('testcase.batchExecute')}
                </Button>
              )}
            </div>

            {currentResults.length > 0 && (
              <div style={{ marginTop: 'var(--spacing-sm)' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                  {t('testcase.results')}
                </div>
                {currentResults.map((r, idx) => (
                  <div key={r.stepId} style={{
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    fontSize: 'var(--font-size-xs)',
                    padding: '2px 0',
                    color: r.status === 'passed' ? 'var(--color-success)' : r.status === 'failed' ? 'var(--color-error)' : 'var(--color-text-muted)',
                  }}>
                    <span>{idx + 1}.</span>
                    <span style={{ flex: 1 }}>{r.stepId}</span>
                    <span>{r.status}</span>
                    <span>{r.duration}ms</span>
                    {r.error && <span style={{ color: 'var(--color-error)' }}>{r.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
            {caseOptions.length === 0
              ? t('testcase.noCases')
              : t('testcase.selectToExecute')}
          </div>
        )}

        {devices.length === 0 && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
            {t('testcase.connectDeviceFirst')}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ExecutionPanel;
