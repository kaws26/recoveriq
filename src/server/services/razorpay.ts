// RecoverIQ — Razorpay Connection Provider Architecture
// Implements secure server-side credentials abstraction, validation, order generation & test-mode synchronization

export interface RazorpayCredentials {
  keyId: string;
  keySecret: string;
}

export interface RazorpayConnectionStatus {
  connected: boolean;
  environment: 'test' | 'live';
  status: 'healthy' | 'invalid_credentials' | 'unreachable' | 'not_configured';
  keyIdMasked?: string;
  lastVerifiedAt?: string;
  errorMessage?: string;
}

export interface IRazorpayConnectionProvider {
  validateCredentials(credentials: RazorpayCredentials): Promise<{ valid: boolean; error?: string }>;
  createOrder(params: {
    amount: number; // in minor units (paisa)
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<{ id: string; amount: number; currency: string; status: string }>;
  fetchPayment(paymentId: string): Promise<any>;
  fetchRecentPayments(params?: { from?: number; count?: number }): Promise<any[]>;
}

export class RazorpayApiKeyConnectionProvider implements IRazorpayConnectionProvider {
  private keyId: string;
  private keySecret: string;

  constructor(keyId: string, keySecret: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`;
  }

  /**
   * Securely tests the credentials against the official Razorpay Test Mode endpoint.
   */
  public async validateCredentials(credentials?: RazorpayCredentials): Promise<{ valid: boolean; error?: string }> {
    const keyId = credentials?.keyId || this.keyId;
    const keySecret = credentials?.keySecret || this.keySecret;

    if (!keyId || !keySecret) {
      return { valid: false, error: 'Key ID and Key Secret are required.' };
    }

    if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
      return { valid: false, error: 'Invalid Razorpay Key ID format. Test keys start with "rzp_test_".' };
    }

    try {
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
      const response = await fetch('https://api.razorpay.com/v1/payments?count=1', {
        method: 'GET',
        headers: {
          Authorization: authHeader,
        },
      });

      if (response.status === 401 || response.status === 403) {
        return { valid: false, error: 'Authentication failed. Please verify your Razorpay Test Key ID and Secret.' };
      }

      if (!response.ok) {
        return { valid: false, error: `Razorpay API responded with status ${response.status}.` };
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: `Network error reaching Razorpay: ${err.message}` };
    }
  }

  /**
   * Creates an official Razorpay Order in Test Mode.
   */
  public async createOrder(params: {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<{ id: string; amount: number; currency: string; status: string }> {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Razorpay Order creation failed (${response.status}): ${errText}`);
    }

    return response.json();
  }

  /**
   * Fetches specific payment by ID.
   */
  public async fetchPayment(paymentId: string): Promise<any> {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payment ${paymentId}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetches recent payment records for incremental synchronization.
   */
  public async fetchRecentPayments(params?: { from?: number; count?: number }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', String(params.from));
    if (params?.count) query.set('count', String(params.count || 20));

    const response = await fetch(`https://api.razorpay.com/v1/payments?${query.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.items || [];
  }
}

// In-Memory Secure Credentials Store (Isolated per Merchant, Secrets NEVER sent to Client)
class RazorpayCredentialsVault {
  private credentialsMap: Map<string, RazorpayCredentials> = new Map();
  private connectionStatusMap: Map<string, RazorpayConnectionStatus> = new Map();

  constructor() {
    // Check environment variables as default test key if present
    const envKeyId = process.env.RAZORPAY_KEY_ID;
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (envKeyId && envKeySecret) {
      this.saveCredentials('merchant_rzp_live_01', {
        keyId: envKeyId,
        keySecret: envKeySecret,
      });
    }
  }

  public getProvider(merchantId: string): RazorpayApiKeyConnectionProvider | null {
    const creds = this.credentialsMap.get(merchantId);
    if (!creds || !creds.keyId || !creds.keySecret) {
      return null;
    }
    return new RazorpayApiKeyConnectionProvider(creds.keyId, creds.keySecret);
  }

  public getPublicStatus(merchantId: string): RazorpayConnectionStatus {
    const status = this.connectionStatusMap.get(merchantId);
    if (status) return status;

    const creds = this.credentialsMap.get(merchantId);
    if (creds) {
      return {
        connected: true,
        environment: creds.keyId.startsWith('rzp_live_') ? 'live' : 'test',
        status: 'healthy',
        keyIdMasked: this.maskKeyId(creds.keyId),
        lastVerifiedAt: new Date().toISOString(),
      };
    }

    return {
      connected: false,
      environment: 'test',
      status: 'not_configured',
    };
  }

  public getPublicClientKey(merchantId: string): string | undefined {
    const creds = this.credentialsMap.get(merchantId);
    return creds?.keyId;
  }

  public saveCredentials(merchantId: string, creds: RazorpayCredentials, isHealthy = true, errorMsg?: string): RazorpayConnectionStatus {
    this.credentialsMap.set(merchantId, creds);

    const status: RazorpayConnectionStatus = {
      connected: isHealthy,
      environment: creds.keyId.startsWith('rzp_live_') ? 'live' : 'test',
      status: isHealthy ? 'healthy' : 'invalid_credentials',
      keyIdMasked: this.maskKeyId(creds.keyId),
      lastVerifiedAt: new Date().toISOString(),
      errorMessage: errorMsg,
    };

    this.connectionStatusMap.set(merchantId, status);
    return status;
  }

  public disconnect(merchantId: string) {
    this.credentialsMap.delete(merchantId);
    this.connectionStatusMap.set(merchantId, {
      connected: false,
      environment: 'test',
      status: 'not_configured',
    });
  }

  private maskKeyId(keyId: string): string {
    if (keyId.length <= 12) return 'rzp_test_••••';
    return `${keyId.substring(0, 9)}••••${keyId.substring(keyId.length - 4)}`;
  }
}

export const razorpayVault = new RazorpayCredentialsVault();
