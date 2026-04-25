import React from 'react';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import { useTestcaseStore, TestReport } from '../../stores/testcase.store';

const ReportViewer: React.FC = () => {
  const reports = useTestcaseStore((s) => s.reports);

  const statusColor = (status: string) =>
    status === 'passed' ? 'var(--color-success)' : status === 'failed' ? 'var(--color-error)' : 'var(--color-text-muted)';

  return (
    <Card title="Test Reports">
      {reports.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          No reports yet. Execute a test case to generate one.
        </div>
      ) : (
        reports.map((report) => (
          <div key={report.id} style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>{report.testCaseName}</div>
            <div style={{ display: 'flex', gap: 'var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>
              <span>Device: {report.deviceName}</span>
              <span>Time: {new Date(report.executedAt).toLocaleString()}</span>
              <span>Duration: {report.totalDuration}ms</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-xs)' }}>
              <span style={{ color: statusColor('passed') }}>Passed: {report.passed}</span>
              <span style={{ color: statusColor('failed') }}>Failed: {report.failed}</span>
              <span>Total: {report.total}</span>
            </div>
            {report.results.map((r, idx) => (
              <div key={r.stepId} style={{ display: 'flex', gap: 'var(--spacing-sm)', padding: '2px 0', paddingLeft: 'var(--spacing-sm)', fontSize: '10px' }}>
                <span>{idx + 1}.</span>
                <span style={{ color: statusColor(r.status) }}>{r.status}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{r.duration}ms</span>
                {r.error && <span style={{ color: 'var(--color-error)' }}>{r.error}</span>}
              </div>
            ))}
          </div>
        ))
      )}
    </Card>
  );
};

export default ReportViewer;
