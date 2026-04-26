import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import { useTestcaseStore, TestCase } from '../../stores/testcase.store';

interface CaseListProps {
  onSelect: (tc: TestCase) => void;
  activeCaseId: string | null;
}

const CaseList: React.FC<CaseListProps> = ({ onSelect, activeCaseId }) => {
  const { t } = useTranslation();
  const { testCases, addTestCase, deleteTestCase } = useTestcaseStore();

  const handleCreate = () => {
    const tc: TestCase = {
      id: crypto.randomUUID(),
      name: t('testcase.new'),
      description: '',
      author: '',
      steps: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addTestCase(tc);
    onSelect(tc);
  };

  return (
    <Card
      title={t('testcase.title')}
      headerActions={<Button size="sm" variant="primary" onClick={handleCreate}>{t('testcase.new')}</Button>}
    >
      {testCases.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          {t('testcase.noCases')}
        </div>
      ) : (
        testCases.map((tc) => (
          <div
            key={tc.id}
            className={`device-item ${tc.id === activeCaseId ? 'device-item--active' : ''}`}
            onClick={() => onSelect(tc)}
          >
            <span className="device-item-name">{tc.name}</span>
            <span className="device-item-id">{tc.steps.length} {t('testcase.steps')}</span>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteTestCase(tc.id); }}>{t('testcase.del')}</Button>
          </div>
        ))
      )}
    </Card>
  );
};

export default CaseList;
