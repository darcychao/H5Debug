import React, { useState } from 'react';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import { useTestcaseStore, TestStep } from '../../stores/testcase.store';
import { useCdpEvent } from '../../hooks/useCdpEvent';

interface RecorderProps {
  deviceId: string | null;
}

const Recorder: React.FC<RecorderProps> = ({ deviceId }) => {
  const [recording, setRecording] = useState(false);
  const [recordedSteps, setRecordedSteps] = useState<TestStep[]>([]);
  const { addTestCase } = useTestcaseStore();

  useCdpEvent('testcase:record:step', (step: any) => {
    setRecordedSteps((prev) => [...prev, step as TestStep]);
  });

  const handleStart = async () => {
    if (!deviceId || !window.electronAPI) return;
    try {
      await window.electronAPI.invoke('testcase:record:start', deviceId);
      setRecording(true);
      setRecordedSteps([]);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handleStop = async () => {
    if (!window.electronAPI) return;
    try {
      const steps = (await window.electronAPI.invoke('testcase:record:stop')) as TestStep[];
      setRecording(false);
      setRecordedSteps(steps || []);
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const handleSave = () => {
    if (recordedSteps.length === 0) return;
    addTestCase({
      id: crypto.randomUUID(),
      name: `Recorded ${new Date().toLocaleString()}`,
      description: 'Auto-recorded test case',
      author: '',
      steps: recordedSteps,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setRecordedSteps([]);
  };

  return (
    <Card
      title="Recorder"
      headerActions={
        !recording ? (
          <Button size="sm" variant="primary" onClick={handleStart} disabled={!deviceId}>
            Record
          </Button>
        ) : (
          <Button size="sm" variant="danger" onClick={handleStop}>
            Stop
          </Button>
        )
      }
    >
      {recording && (
        <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
          Recording... {recordedSteps.length} steps captured
        </div>
      )}
      {recordedSteps.map((step, idx) => (
        <div key={step.id} style={{ fontSize: 'var(--font-size-xs)', padding: '2px 0', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ color: 'var(--color-text-muted)', marginRight: 'var(--spacing-xs)' }}>{idx + 1}.</span>
          <span style={{ color: 'var(--color-accent)', fontWeight: 600, marginRight: 'var(--spacing-sm)' }}>{step.type}</span>
          <span>{step.name || step.selector || '(no name)'}</span>
        </div>
      ))}
      {!recording && recordedSteps.length > 0 && (
        <Button size="sm" variant="primary" onClick={handleSave} style={{ marginTop: 'var(--spacing-sm)' }}>
          Save as Test Case
        </Button>
      )}
      {!recording && recordedSteps.length === 0 && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          Click "Record" to start capturing operations
        </div>
      )}
    </Card>
  );
};

export default Recorder;
