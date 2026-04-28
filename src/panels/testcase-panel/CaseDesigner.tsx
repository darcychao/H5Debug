import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import Input from '../../components/pixel-ui/Input';
import Select from '../../components/pixel-ui/Select';
import Modal from '../../components/pixel-ui/Modal';
import { useTestcaseStore, TestCase, TestStep, StepType } from '../../stores/testcase.store';
import SelectorPicker from './SelectorPicker';

interface CaseDesignerProps {
  testCase: TestCase | null;
  onCreateCase?: (tc: TestCase) => void;
  deviceId: string | null;
}

const CaseDesigner: React.FC<CaseDesignerProps> = ({ testCase, onCreateCase, deviceId }) => {
  const { t } = useTranslation();
  const { updateTestCase, addTestCase, addStep, updateStep, deleteStep } = useTestcaseStore();
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [editingStep, setEditingStep] = useState<TestStep | null>(null);
  const [insertAfterIdx, setInsertAfterIdx] = useState(-1);
  const [showSelectorPicker, setShowSelectorPicker] = useState(false);
  const [selectorField, setSelectorField] = useState<'selector' | 'conditionSelector'>('selector');

  if (!testCase) {
    return (
      <Card title={t('testcase.caseDesigner')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl)', flex: 1, minHeight: 300 }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center' }}>
            {t('testcase.selectToDesign')}
          </div>
          <Button size="md" variant="primary" onClick={() => {
            const tc: TestCase = {
              id: crypto.randomUUID(),
              name: '',
              description: '',
              author: '',
              steps: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            addTestCase(tc);
            onCreateCase?.(tc);
          }}>
            {t('testcase.new')}
          </Button>
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
      title={testCase.name || t('testcase.caseDesigner')}
      headerActions={
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <Input
            value={testCase.name}
            onChange={(e) => updateTestCase(testCase.id, { name: (e.target as HTMLInputElement).value })}
            style={{ width: 180 }}
            placeholder={t('testcase.new')}
          />
          <Button size="sm" variant="primary" onClick={() => handleAddStep(testCase.steps.length - 1)}>{t('testcase.addStep')}</Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 300 }}>
        <div style={{ flexShrink: 0, marginBottom: 'var(--spacing-sm)' }}>
          <Input
            label={t('testcase.description')}
            value={testCase.description}
            onChange={(e) => updateTestCase(testCase.id, { description: (e.target as HTMLInputElement).value })}
            placeholder="Add description..."
          />
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {testCase.steps.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
              {t('testcase.noStepsYet')}
            </div>
          ) : testCase.steps.map((step, idx) => (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderBottom: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-xs)',
                flexShrink: 0,
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
        </div>
      </div>

      <Modal
        open={showStepEditor}
        onClose={() => { setShowStepEditor(false); setEditingStep(null); setShowSelectorPicker(false); }}
        title={t('testcase.stepEditor')}
        footer={<Button variant="primary" onClick={handleSaveStep}>{t('testcase.save')}</Button>}
      >
        {editingStep && (
          <StepEditorForm
            step={editingStep}
            onChange={setEditingStep}
            allSteps={testCase.steps}
            deviceId={deviceId}
            onOpenSelectorPicker={(field) => { setSelectorField(field); setShowSelectorPicker(true); }}
          />
        )}
      </Modal>

      <Modal
        open={showStepEditor && showSelectorPicker}
        onClose={() => setShowSelectorPicker(false)}
        title={t('selector.title') || 'Select Element'}
        width={640}
      >
        <SelectorPicker
          deviceId={deviceId}
          onSelect={(sel) => {
            if (editingStep) {
              if (selectorField === 'selector') {
                setEditingStep({ ...editingStep, selector: sel });
              } else if (selectorField === 'conditionSelector') {
                setEditingStep({
                  ...editingStep,
                  condition: {
                    ...editingStep.condition,
                    selector: sel,
                    type: editingStep.condition?.type || 'elementExists'
                  }
                });
              }
            }
            setShowSelectorPicker(false);
          }}
        />
      </Modal>
    </Card>
  );
};

const StepEditorForm: React.FC<{
  step: TestStep;
  onChange: (step: TestStep) => void;
  allSteps: TestStep[];
  deviceId: string | null;
  onOpenSelectorPicker: (field: 'selector' | 'conditionSelector') => void;
}> = ({ step, onChange, allSteps, deviceId, onOpenSelectorPicker }) => {
  const { t } = useTranslation();
  const update = (updates: Partial<TestStep>) => onChange({ ...step, ...updates });

  const SelectorInputWithPicker = ({ label, value, onChange, field }: { label: string, value: string, onChange: (v: string) => void, field: 'selector' | 'conditionSelector' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && <label className="pixel-input-label">{label}</label>}
      <div style={{ display: 'flex', gap: '4px' }}>
        <input
          className="pixel-input"
          style={{ flex: 1 }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. #login-btn"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onOpenSelectorPicker(field)}
          disabled={!deviceId}
          style={{ flexShrink: 0 }}
        >
          {t('selector.pick') || '📌'}
        </Button>
      </div>
    </div>
  );

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
        <SelectorInputWithPicker
          label={t('testcase.selector')}
          value={step.selector || ''}
          onChange={(v) => update({ selector: v })}
          field="selector"
        />
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
          <SelectorInputWithPicker
            label={t('testcase.conditionSelector')}
            value={step.condition?.selector || ''}
            onChange={(v) => update({ condition: { type: step.condition?.type || 'elementExists', selector: v } })}
            field="conditionSelector"
          />
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
