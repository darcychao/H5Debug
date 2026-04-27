import { CdpClient } from './cdp-client';

export class ScreencastService {
  private client: CdpClient;
  private sessionId: string | null = null;

  constructor(client: CdpClient) {
    this.client = client;
  }

  async start(options?: { format?: string; quality?: number; maxWidth?: number; maxHeight?: number }): Promise<void> {
    const params = {
      format: options?.format || 'jpeg',
      quality: options?.quality || 80,
      maxWidth: options?.maxWidth || 720,
      maxHeight: options?.maxHeight || 1280,
    };
    try { await this.client.send('Page.enable'); } catch {}
    await this.client.send('Page.startScreencast', params);
  }

  async stop(): Promise<void> {
    try { await this.client.send('Page.stopScreencast'); } catch {}
  }

  onFrame(callback: (data: string, metadata: { timestamp: number; sessionId: string }) => void): () => void {
    const handler = (params: any) => {
      if (params?.data && params?.metadata) {
        callback(params.data, {
          timestamp: params.metadata.timestamp,
          sessionId: params.metadata.sessionId || params.sessionId,
        });
      }
    };
    this.client.on('Page.screencastFrame', handler);
    return () => this.client.removeListener('Page.screencastFrame', handler);
  }

  async acknowledgeFrame(sessionId: string): Promise<void> {
    try { await this.client.send('Page.screencastFrameAck', { sessionId }); } catch {}
  }

  async captureScreenshot(): Promise<string> {
    const result = (await this.client.send('Page.captureScreenshot', {
      format: 'png',
    })) as { data: string };
    return result.data;
  }
}
