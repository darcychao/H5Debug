import { CdpClient } from './cdp-client';
import { EventEmitter } from 'events';

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

export interface NetworkResponse {
  id: string;
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
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

export class NetworkService extends EventEmitter {
  private client: CdpClient;
  private interceptRules: InterceptRule[] = [];
  private interceptEnabled: boolean = false;
  private requestMap: Map<string, NetworkRequest> = new Map();

  constructor(client: CdpClient) {
    super();
    this.client = client;
  }

  async enableIntercept(patterns?: Array<{ urlPattern: string; requestStage?: string }>): Promise<void> {
    this.interceptEnabled = true;
    try {
      await this.client.send('Network.enable');
    } catch (e) {
      console.log('[NetworkService] Network.enable failed, continuing:', e);
    }

    try {
      const fetchPatterns = patterns || this.buildPatterns();
      await this.client.send('Fetch.enable', {
        patterns: fetchPatterns.length > 0 ? fetchPatterns : [{ urlPattern: '*' }],
        handleAuthRequests: false,
      });
      console.log('[NetworkService] Fetch.enable succeeded');

      this.client.on('Fetch.requestPaused', (params: any) => {
        this.handleRequestPaused(params);
      });
    } catch (e) {
      console.log('[NetworkService] Fetch.enable failed, network interception may not work:', e);
    }

    // Also listen to Network events for logging
    this.client.on('Network.requestWillBeSent', (params: any) => {
      this.handleRequestWillBeSent(params);
    });

    this.client.on('Network.responseReceived', (params: any) => {
      this.handleResponseReceived(params);
    });

    this.client.on('Network.loadingFinished', (params: any) => {
      this.handleLoadingFinished(params);
    });
  }

  async disableIntercept(): Promise<void> {
    this.interceptEnabled = false;
    try {
      await this.client.send('Fetch.disable');
    } catch (e) {
      console.log('[NetworkService] Fetch.disable failed:', e);
    }
  }

  isInterceptEnabled(): boolean {
    return this.interceptEnabled;
  }

  setInterceptRules(rules: InterceptRule[]): void {
    this.interceptRules = rules;
  }

  getInterceptRules(): InterceptRule[] {
    return [...this.interceptRules];
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
      if (modifications.headers) {
        params.headers = Object.entries(modifications.headers).map(([name, value]) => ({ name, value }));
      }
      if (modifications.postData) {
        params.postData = Buffer.from(modifications.postData).toString('base64');
      }
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
    try {
      const result = (await this.client.send('Fetch.getResponseBody', { requestId })) as { body: string; base64Encoded: boolean };
      if (result.base64Encoded) {
        return Buffer.from(result.body, 'base64').toString('utf-8');
      }
      return result.body;
    } catch (e) {
      return '';
    }
  }

  private buildPatterns(): Array<{ urlPattern: string }> {
    return this.interceptRules
      .filter((r) => r.enabled)
      .map((r) => ({ urlPattern: r.urlPattern }));
  }

  private async handleRequestPaused(params: any): Promise<void> {
    const { requestId, request, resourceType } = params;
    console.log('[NetworkService] Fetch.requestPaused:', request.method, request.url);

    // Emit event even if no rule matches for logging
    const networkRequest: NetworkRequest = {
      id: requestId,
      requestId: requestId,
      url: request.url,
      method: request.method,
      headers: request.headers || {},
      postData: request.postData,
      resourceType: resourceType || 'Other',
      timestamp: Date.now(),
    };
    this.requestMap.set(requestId, networkRequest);
    this.emit('request', networkRequest);

    // Check if any rule matches
    for (const rule of this.interceptRules) {
      if (!rule.enabled) continue;
      try {
        const regex = new RegExp(rule.urlPattern);
        if (!regex.test(request.url)) continue;
      } catch {
        if (!request.url.includes(rule.urlPattern)) continue;
      }

      console.log('[NetworkService] Rule matched:', rule.name, rule.action);

      switch (rule.action) {
        case 'block':
          await this.failRequest(requestId);
          this.emit('request-blocked', networkRequest, rule);
          return;
        case 'modify':
          await this.continueRequest(requestId, rule.modifications);
          this.emit('request-modified', networkRequest, rule);
          return;
        case 'mock':
          if (rule.mockResponse) {
            await this.fulfillRequest(requestId, rule.mockResponse);
            this.emit('request-mocked', networkRequest, rule);
            return;
          }
          break;
      }
    }

    // No rule matched - pass through
    await this.continueRequest(requestId);
  }

  private handleRequestWillBeSent(params: any): void {
    const { requestId, request, resourceType, timestamp } = params;
    const networkRequest: NetworkRequest = {
      id: requestId,
      requestId: requestId,
      url: request.url,
      method: request.method,
      headers: request.headers || {},
      postData: request.postData,
      resourceType: resourceType || 'Other',
      timestamp: timestamp ? Math.round(timestamp * 1000) : Date.now(),
    };
    this.requestMap.set(requestId, networkRequest);
    this.emit('request', networkRequest);
  }

  private handleResponseReceived(params: any): void {
    const { requestId, response, timestamp } = params;
    const networkResponse: NetworkResponse = {
      id: requestId,
      requestId: requestId,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers || {},
      timestamp: timestamp ? Math.round(timestamp * 1000) : Date.now(),
    };
    this.emit('response', networkResponse);
  }

  private async handleLoadingFinished(params: any): Promise<void> {
    const { requestId } = params;
    // Try to get response body if we have the request
    try {
      const body = await this.getResponseBody(requestId);
      const existingResponse: NetworkResponse = {
        id: requestId,
        requestId: requestId,
        status: 200,
        statusText: 'OK',
        headers: {},
        body: body,
        timestamp: Date.now(),
      };
      this.emit('response-body', existingResponse);
    } catch (e) {
      // Ignore body errors
    }
  }
}
