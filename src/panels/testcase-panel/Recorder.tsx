import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import { useTestcaseStore, TestStep } from '../../stores/testcase.store';
import { useCdpEvent } from '../../hooks/useCdpEvent';

interface RecorderProps {
  deviceId: string | null;
  onCaseCreated?: (caseId: string) => void;
}

const Recorder: React.FC<RecorderProps> = ({ deviceId, onCaseCreated }) => {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState<TestStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { addTestCase } = useTestcaseStore();

  // Accumulate steps from real-time events (also used for live preview)
  useCdpEvent('testcase:record:step', useCallback((step: any) => {
    setRecordedSteps((prev) => [...prev, step as TestStep]);
  }, []));

  const handleStart = async () => {
    if (!deviceId || !window.electronAPI) return;
    try {
      await window.electronAPI.invoke('testcase:record:start', deviceId);
      setRecording(true);
      setRecordedSteps([]);
      setSaved(false);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handleStop = async () => {
    if (!window.electronAPI) return;
    try {
      const steps = (await window.electronAPI.invoke('testcase:record:stop')) as TestStep[];
      setRecording(false);
      // Use steps from stop() as the canonical source
      if (steps && steps.length > 0) {
        setRecordedSteps(steps);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setRecording(false);
    }
  };

  const handleSave = async () => {
    if (recordedSteps.length === 0 || saving) return;
    setSaving(true);
    try {
      const tc = {
        id: crypto.randomUUID(),
        name: `Recorded ${new Date().toLocaleString()}`,
        description: 'Auto-recorded test case',
        author: '',
        steps: recordedSteps,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await addTestCase(tc);
      setSaved(true);
      onCaseCreated?.(tc.id);
      // Clear after short delay so user sees feedback
      setTimeout(() => {
        setRecordedSteps([]);
        setSaved(false);
      }, 500);
    } catch (err) {
      console.error('Failed to save recorded case:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setRecordedSteps([]);
    setSaved(false);
  };

  return (
    <Card
      title={t('testcase.recorder') || 'Recorder'}
      headerActions={
        !recording ? (
          <Button size="sm" variant="primary" onClick={handleStart} disabled={!deviceId}>
            {t('testcase.record') || 'Record'}
          </Button>
        ) : (
          <Button size="sm" variant="danger" onClick={handleStop}>
            {t('testcase.stop') || 'Stop'}
          </Button>
        )
      }
    >
      {recording && (
        <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
          {t('testcase.recording') || 'Recording'}... {recordedSteps.length} {t('testcase.steps')}
        </div>
      )}
      {recordedSteps.map((step, idx) => (
        <div key={step.id || idx} style={{ fontSize: 'var(--font-size-xs)', padding: '2px 0', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ color: 'var(--color-text-muted)', marginRight: 'var(--spacing-xs)' }}>{idx + 1}.</span>
          <span style={{ color: 'var(--color-accent)', fontWeight: 600, marginRight: 'var(--spacing-sm)' }}>{step.type}</span>
          <span>{step.name || step.selector || '(no name)'}</span>
        </div>
      ))}
      {!recording && recordedSteps.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
          <Button size="sm" variant="primary" onClick={handleSave} disabled={saving || saved}>
            {saved ? (t('common.success') || 'Saved!') : (t('testcase.saveAsCase') || 'Save as Test Case')}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDiscard} disabled={saving}>
            {t('testcase.discard') || 'Discard'}
          </Button>
        </div>
      )}
      {!recording && recordedSteps.length === 0 && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          {t('testcase.recordHint') || 'Click "Record" to start capturing operations'}
        </div>
      )}
    </Card>
  );
};

export default Recorder;
