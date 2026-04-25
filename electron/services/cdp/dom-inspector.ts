import { CdpClient } from './cdp-client';

export class DomInspectorService {
  private client: CdpClient;

  constructor(client: CdpClient) {
    this.client = client;
  }

  async enable(): Promise<void> {
    await this.client.send('DOM.enable');
  }

  async disable(): Promise<void> {
    await this.client.send('DOM.disable');
  }

  async getDocument(depth = -1): Promise<unknown> {
    const result = await this.client.send('DOM.getDocument', { depth, pierce: true });
    return result;
  }

  async querySelector(nodeId: number, selector: string): Promise<number | null> {
    const result = (await this.client.send('DOM.querySelector', {
      nodeId,
      selector,
    })) as { nodeId: number };
    return result.nodeId || null;
  }

  async querySelectorAll(nodeId: number, selector: string): Promise<number[]> {
    const result = (await this.client.send('DOM.querySelectorAll', {
      nodeId,
      selector,
    })) as { nodeIds: number[] };
    return result.nodeIds || [];
  }

  async describeNode(nodeId: number): Promise<unknown> {
    const result = await this.client.send('DOM.describeNode', { nodeId });
    return result;
  }

  async getOuterHTML(nodeId: number): Promise<string> {
    const result = (await this.client.send('DOM.getOuterHTML', { nodeId })) as { outerHTML: string };
    return result.outerHTML;
  }

  async resolveNode(nodeId: number): Promise<number> {
    const result = (await this.client.send('DOM.resolveNode', { nodeId })) as { object: { objectId: string } };
    return parseInt(result.object.objectId);
  }
}
