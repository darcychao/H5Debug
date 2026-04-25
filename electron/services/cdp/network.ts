import { CdpClient } from './cdp-client';

export interface NetworkRequest {
  id: string;
  requestId: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  resourceType: string;
  timestamp: number;
}

export interface InterceptRule {
  id: string;
  name: string;
  urlPattern: string;
  action: 'block' | 'modify' | 'mock';
  modifications?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    postData?: string;
  };
  mockResponse?: {
    statusCode: number;
    headers?: Record<string, string>;
    body: string;
  };
  enabled: boolean;
}

export class NetworkService {
  private client: CdpClient;
  private interceptRules: InterceptRule[] = [];

  constructor(client: CdpClient) {
    this.client = client;
  }

  async enable(patterns?: Array<{ urlPattern: string; requestStage?: string }>): Promise<void> {
    const fetchPatterns = patterns || this.buildPatterns();
    await this.client.send('Fetch.enable', {
      patterns: fetchPatterns.length > 0 ? fetchPatterns : [{ urlPattern: '*' }],
      handleAuthRequests: false,
    });

    this.client.on('Fetch.requestPaused', (params: any) => {
      this.handleRequestPaused(params);
    });
  }

  async disable(): Promise<void> {
    await this.client.send('Fetch.disable');
  }

  setInterceptRules(rules: InterceptRule[]): void {
    this.interceptRules = rules;
  }

  async continueRequest(requestId: string, modifications?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    postData?: string;
  }): Promise<void> {
    const params: Record<string, unknown> = { requestId };
    if (modifications) {
      if (modifications.url) params.url = modifications.url;
      if (modifications.method) params.method = modifications.method;
      if (modifications.headers) params.headers = modifications.headers;
      if (modifications.postData) params.postData = modifications.postData;
    }
    await this.client.send('Fetch.continueRequest', params);
  }

  async fulfillRequest(requestId: string, response: {
    statusCode: number;
    headers?: Record<string, string>;
    body: string;
  }): Promise<void> {
    const bodyBase64 = Buffer.from(response.body).toString('base64');
    await this.client.send('Fetch.fulfillRequest', {
      requestId,
      responseCode: response.statusCode,
      responseHeaders: response.headers
        ? Object.entries(response.headers).map(([name, value]) => ({ name, value }))
        : [],
      body: bodyBase64,
    });
  }

  async failRequest(requestId: string): Promise<void> {
    await this.client.send('Fetch.failRequest', {
      requestId,
      errorReason: 'BlockedByClient',
    });
  }

  async getResponseBody(requestId: string): Promise<string> {
    const result = (await this.client.send('Fetch.getResponseBody', { requestId })) as { body: string; base64Encoded: boolean };
    if (result.base64Encoded) {
      return Buffer.from(result.body, 'base64').toString('utf-8');
    }
    return result.body;
  }

  private buildPatterns(): Array<{ urlPattern: string }> {
    return this.interceptRules
      .filter((r) => r.enabled)
      .map((r) => ({ urlPattern: r.urlPattern }));
  }

  private async handleRequestPaused(params: any): Promise<void> {
    const { requestId, request, resourceType } = params;

    for (const rule of this.interceptRules) {
      if (!rule.enabled) continue;
      try {
        const regex = new RegExp(rule.urlPattern);
        if (!regex.test(request.url)) continue;
      } catch {
        if (!request.url.includes(rule.urlPattern)) continue;
      }

      switch (rule.action) {
        case 'block':
          await this.failRequest(requestId);
          return;
        case 'modify':
          await this.continueRequest(requestId, rule.modifications);
          return;
        case 'mock':
          if (rule.mockResponse) {
            await this.fulfillRequest(requestId, rule.mockResponse);
            return;
          }
          break;
      }
    }

    // No rule matched - pass through
    await this.continueRequest(requestId);
  }
}
