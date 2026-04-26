import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import Input from '../../components/pixel-ui/Input';
import Select from '../../components/pixel-ui/Select';
import Modal from '../../components/pixel-ui/Modal';
import { useTestcaseStore, TestCase, TestStep, StepType } from '../../stores/testcase.store';

interface CaseDesignerProps {
  testCase: TestCase | null;
}

const CaseDesigner: React.FC<CaseDesignerProps> = ({ testCase }) => {
  const { t } = useTranslation();
  const { updateTestCase, addStep, updateStep, deleteStep } = useTestcaseStore();
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [editingStep, setEditingStep] = useState<TestStep | null>(null);
  const [insertAfterIdx, setInsertAfterIdx] = useState(-1);

  if (!testCase) {
    return (
      <Card title={t('testcase.caseDesigner')}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          {t('testcase.selectToDesign')}
        </div>
      </Card>
    );
  }

  const handleAddStep = (afterIdx = -1) => {
    setEditingStep({
      id: crypto.randomUUID(),
      name: '',
      description: '',
      type: 'click',
    });
    setInsertAfterIdx(afterIdx);
    setShowStepEditor(true);
  };

  const handleSaveStep = () => {
    if (!editingStep) return;
    const existing = testCase.steps.find((s) => s.id === editingStep.id);
    if (existing) {
      updateStep(testCase.id, editingStep.id, editingStep);
    } else {
      // Insert at position
      const newSteps = [...testCase.steps];
      newSteps.splice(insertAfterIdx + 1, 0, editingStep);
      updateTestCase(testCase.id, { steps: newSteps });
    }
    setShowStepEditor(false);
    setEditingStep(null);
  };

  const stepTypeLabels: Record<StepType, string> = {
    input: t('testcase.input'),
    click: t('testcase.click'),
    screenshot: t('testcase.screenshot'),
    branch: t('testcase.branch'),
    loop: t('testcase.loop'),
  };

  return (
    <Card
      title={testCase.name}
      headerActions={
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <Input value={testCase.name} onChange={(e) => updateTestCase(testCase.id, { name: (e.target as HTMLInputElement).value })} style={{ width: 150 }} />
          <Button size="sm" variant="primary" onClick={() => handleAddStep(testCase.steps.length - 1)}>{t('testcase.addStep')}</Button>
        </div>
      }
    >
      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>
        {testCase.description}
      </div>

      {testCase.steps.map((step, idx) => (
        <div
          key={step.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            borderBottom: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          <span style={{ color: 'var(--color-text-muted)', minWidth: 20 }}>{idx + 1}.</span>
          <span style={{
            fontWeight: 600,
            minWidth: 60,
            color: step.type === 'branch' ? 'var(--color-accent-yellow)' : step.type === 'loop' ? 'var(--color-info)' : 'var(--color-accent)',
          }}>
            {stepTypeLabels[step.type]}
          </span>
          <span style={{ flex: 1 }}>{step.name || step.selector || t('testcase.noName')}</span>
          <Button size="sm" variant="ghost" onClick={() => { setEditingStep({ ...step }); setShowStepEditor(true); }}>{t('network.edit')}</Button>
          <Button size="sm" variant="ghost" onClick={() => deleteStep(testCase.id, step.id)}>{t('testcase.del')}</Button>
        </div>
      ))}

      {testCase.steps.length === 0 && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          {t('testcase.noStepsYet')}
        </div>
      )}

      <Modal
        open={showStepEditor}
        onClose={() => { setShowStepEditor(false); setEditingStep(null); }}
        title={t('testcase.stepEditor')}
        footer={<Button variant="primary" onClick={handleSaveStep}>{t('testcase.save')}</Button>}
      >
        {editingStep && (
          <StepEditorForm step={editingStep} onChange={setEditingStep} allSteps={testCase.steps} />
        )}
      </Modal>
    </Card>
  );
};

const StepEditorForm: React.FC<{
  step: TestStep;
  onChange: (step: TestStep) => void;
  allSteps: TestStep[];
}> = ({ step, onChange, allSteps }) => {
  const update = (updates: Partial<TestStep>) => onChange({ ...step, ...updates });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <Input label={t('testcase.stepName')} value={step.name} onChange={(e) => update({ name: (e.target as HTMLInputElement).value })} />
      <Input label={t('testcase.description')} value={step.description} onChange={(e) => update({ description: (e.target as HTMLInputElement).value })} />
      <Select
        label={t('testcase.type')}
        value={step.type}
        options={[
          { value: 'click', label: t('testcase.click') },
          { value: 'input', label: t('testcase.input') },
          { value: 'screenshot', label: t('testcase.screenshot') },
          { value: 'branch', label: t('testcase.branch') },
          { value: 'loop', label: t('testcase.loop') },
        ]}
        onChange={(v) => update({ type: v as StepType })}
      />
      {(step.type === 'click' || step.type === 'input') && (
        <Input label={t('testcase.selector')} value={step.selector || ''} onChange={(e) => update({ selector: (e.target as HTMLInputElement).value })} placeholder="e.g. #login-btn" />
      )}
      {step.type === 'input' && (
        <>
          <Input label={t('testcase.inputValue')} value={step.inputValue || ''} onChange={(e) => update({ inputValue: (e.target as HTMLInputElement).value })} />
          <Input label={t('testcase.verifyValue')} value={step.verifyValue || ''} onChange={(e) => update({ verifyValue: (e.target as HTMLInputElement).value })} />
        </>
      )}
      {step.type === 'branch' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          <Select
            label={t('testcase.conditionType')}
            value={step.condition?.type || 'elementExists'}
            options={[
              { value: 'elementExists', label: t('testcase.elementExists') },
              { value: 'elementNotExists', label: t('testcase.elementNotExists') },
            ]}
            onChange={(v) => update({ condition: { type: v as 'elementExists' | 'elementNotExists', selector: step.condition?.selector || '' } })}
          />
          <Input label={t('testcase.conditionSelector')} value={step.condition?.selector || ''} onChange={(e) => update({ condition: { type: step.condition?.type || 'elementExists', selector: (e.target as HTMLInputElement).value } })} />
        </div>
      )}
      {step.type === 'loop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          <Input label={t('testcase.loopCount')} type="number" value={String(step.loop?.count || 1)} onChange={(e) => update({ loop: { stepIds: step.loop?.stepIds || [], count: parseInt((e.target as HTMLInputElement).value) || 1 } })} />
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            {t('testcase.selectStepsToLoop')}
          </div>
          {allSteps.filter((s) => s.id !== step.id).map((s) => (
            <label key={s.id} style={{ display: 'flex', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)' }}>
              <input
                type="checkbox"
                checked={step.loop?.stepIds?.includes(s.id) || false}
                onChange={(e) => {
                  const ids = new Set(step.loop?.stepIds || []);
                  if (e.target.checked) ids.add(s.id);
                  else ids.delete(s.id);
                  update({ loop: { stepIds: Array.from(ids), count: step.loop?.count || 1 } });
                }}
              />
              {s.name || s.id}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaseDesigner;
