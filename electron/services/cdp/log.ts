import { CdpClient } from './cdp-client';

export interface LogEntry {
  source: string;
  level: string;
  text: string;
  timestamp: number;
  url?: string;
  lineNumber?: number;
}

export class LogService {
  private client: CdpClient;

  constructor(client: CdpClient) {
    this.client = client;
  }

  async enable(): Promise<void> {
    await this.client.send('Log.enable');
    // Also enable Runtime domain to capture console messages
    await this.client.send('Runtime.enable').catch(() => {});
  }

  async disable(): Promise<void> {
    await this.client.send('Log.disable');
  }

  onEntryAdded(callback: (entry: LogEntry) => void): () => void {
    // Listen for Log.entryAdded events
    const logHandler = (params: any) => {
      const entry = params.entry as LogEntry;
      callback(entry);
    };
    this.client.on('Log.entryAdded', logHandler);

    // Also listen for Runtime.consoleAPICalled events (alternative way to get logs)
    const consoleHandler = (params: any) => {
      const entry: LogEntry = {
        source: 'console',
        level: params.type === 1 ? 'WARNING' : params.type === 2 ? 'ERROR' : 'INFO',
        text: params.args?.map((a: any) => a.value || String(a)).join(' ') || '',
        timestamp: Date.now(),
        url: params.context?.url || undefined,
        lineNumber: params.context?.lineNumber || undefined,
      };
      callback(entry);
    };
    this.client.on('Runtime.consoleAPICalled', consoleHandler);

    return () => {
      this.client.removeListener('Log.entryAdded', logHandler);
      this.client.removeListener('Runtime.consoleAPICalled', consoleHandler);
    };
  }
}
