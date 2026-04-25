import { TestReport } from './engine';
import * as fs from 'fs';
import * as path from 'path';

export class ReportGenerator {
  private reportDir: string;

  constructor(reportDir: string = './reports') {
    this.reportDir = reportDir;
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  }

  async generate(report: TestReport): Promise<string> {
    const html = this.buildHtml(report);
    const filename = `${report.testCaseName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date(report.executedAt).toISOString().replace(/[:.]/g, '-')}.html`;
    const filepath = path.join(this.reportDir, filename);

    fs.writeFileSync(filepath, html, 'utf-8');
    return filepath;
  }

  private buildHtml(report: TestReport): string {
    const statusColor = (status: string) =>
      status === 'passed' ? '#2d6a4f' : status === 'failed' ? '#8b2500' : '#6a6a80';

    const rows = report.results
      .map(
        (r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.stepId}</td>
        <td style="color: ${statusColor(r.status)}; font-weight: 600;">${r.status.toUpperCase()}</td>
        <td>${r.duration}ms</td>
        <td>${r.error ? `<span style="color: #8b2500;">${this.escapeHtml(r.error)}</span>` : '-'}</td>
        <td>${r.screenshot ? `<img src="data:image/png;base64,${r.screenshot}" style="max-width: 200px; border: 1px solid #3a3a5c;" />` : '-'}</td>
      </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Test Report - ${this.escapeHtml(report.testCaseName)} - ${new Date(report.executedAt).toLocaleString()}</title>
  <style>
    body { font-family: 'Courier New', monospace; background: #0d0d1a; color: #e0e0e0; padding: 24px; }
    h1 { color: #2d6a4f; letter-spacing: 1px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #3a3a5c; padding: 8px; text-align: left; font-size: 12px; }
    th { background: #1a1a2e; color: #a0a0b0; text-transform: uppercase; }
    tr:hover { background: #252540; }
    .summary { display: flex; gap: 24px; margin: 16px 0; font-size: 14px; }
    .summary span { padding: 4px 12px; border: 1px solid #3a3a5c; border-radius: 4px; }
    .pass { color: #2d6a4f; }
    .fail { color: #8b2500; }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(report.testCaseName)}</h1>
  <p>Author: ${this.escapeHtml(report.author)} | Device: ${this.escapeHtml(report.deviceName)} | Time: ${new Date(report.executedAt).toLocaleString()}</p>
  <div class="summary">
    <span class="pass">Passed: ${report.passed}</span>
    <span class="fail">Failed: ${report.failed}</span>
    <span>Total: ${report.total}</span>
    <span>Duration: ${report.totalDuration}ms</span>
  </div>
  <table>
    <thead>
      <tr><th>#</th><th>Step</th><th>Status</th><th>Duration</th><th>Error</th><th>Screenshot</th></tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
