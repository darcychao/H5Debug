import React, { useEffect } from 'react';
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
  const { testCases, addTestCase, deleteTestCase, loadTestCases, loaded } = useTestcaseStore();

  useEffect(() => {
    if (!loaded) {
      loadTestCases();
    }
  }, [loadTestCases, loaded]);

  const handleCreate = async () => {
    const tc: TestCase = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      author: '',
      steps: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await addTestCase(tc);
    onSelect(tc);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteTestCase(id);
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
            <span className="device-item-name">{tc.name || t('testcase.new')}</span>
            <span className="device-item-id">{tc.steps.length} {t('testcase.steps')}</span>
            <Button size="sm" variant="ghost" onClick={(e) => handleDelete(e, tc.id)}>{t('testcase.del')}</Button>
          </div>
        ))
      )}
    </Card>
  );
};

export default CaseList;
