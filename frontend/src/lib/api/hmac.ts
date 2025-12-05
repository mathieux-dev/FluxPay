export interface HMACConfig {
  apiKey: string;
  apiSecret: string;
}

export interface SignedRequest {
  headers: {
    'X-Api-Key': string;
    'X-Timestamp': string;
    'X-Nonce': string;
    'X-Signature': string;
  };
}

export class HMACRequestSigner {
  constructor(private config: HMACConfig) {}

  async signRequest(
    method: string,
    path: string,
    body?: unknown
  ): Promise<SignedRequest> {
    const timestamp = Date.now().toString();
    const nonce = this.generateNonce();
    const bodySha256 = await this.hashBody(body);
    
    const message = `${timestamp}.${nonce}.${method}.${path}.${bodySha256}`;
    const signature = await this.computeSignature(message);

    return {
      headers: {
        'X-Api-Key': this.config.apiKey,
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-Signature': signature,
      },
    };
  }

  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async computeSignature(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.apiSecret);
    const messageData = encoder.encode(message);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  private async hashBody(body: unknown): Promise<string> {
    if (!body) return '';
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    const encoder = new TextEncoder();
    const data = encoder.encode(bodyString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer), byte => byte.toString(16).padStart(2, '0')).join('');
  }
}
