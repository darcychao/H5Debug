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
  }

  async disable(): Promise<void> {
    await this.client.send('Log.disable');
  }

  onEntryAdded(callback: (entry: LogEntry) => void): () => void {
    const handler = (params: any) => {
      const entry = params.entry as LogEntry;
      callback(entry);
    };
    this.client.on('Log.entryAdded', handler);
    return () => this.client.removeListener('Log.entryAdded', handler);
  }
}
