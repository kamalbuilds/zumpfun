/**
 * API client for ZumpFun backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generic API request handler
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data as T;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Token-related API calls
 */
export const tokenApi = {
  /**
   * Get all tokens
   */
  getAll: () => apiRequest('/tokens'),

  /**
   * Get token by address
   */
  getByAddress: (address: string) => apiRequest(`/tokens/${address}`),

  /**
   * Get token statistics
   */
  getStats: (address: string) => apiRequest(`/tokens/${address}/stats`),

  /**
   * Get token holders
   */
  getHolders: (address: string) => apiRequest(`/tokens/${address}/holders`),

  /**
   * Get token transactions
   */
  getTransactions: (address: string, limit = 50) =>
    apiRequest(`/tokens/${address}/transactions?limit=${limit}`),
};

/**
 * Circuit-related API calls
 */
export const circuitApi = {
  /**
   * Get circuit manifest
   */
  getManifest: (circuitName: string) => apiRequest(`/circuits/${circuitName}/manifest.json`),

  /**
   * Verify proof server-side (optional additional verification)
   */
  verifyProof: (circuitName: string, proof: any, publicInputs: string[]) =>
    apiRequest('/circuits/verify', {
      method: 'POST',
      body: JSON.stringify({ circuitName, proof, publicInputs }),
    }),
};

/**
 * Analytics API calls
 */
export const analyticsApi = {
  /**
   * Get platform statistics
   */
  getPlatformStats: () => apiRequest('/analytics/platform'),

  /**
   * Get trending tokens
   */
  getTrending: () => apiRequest('/analytics/trending'),

  /**
   * Get recent launches
   */
  getRecentLaunches: (limit = 10) => apiRequest(`/analytics/recent?limit=${limit}`),
};

/**
 * WebSocket connection for real-time updates
 */
export class RealtimeClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(WS_BASE_URL);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to event
   */
  subscribe(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Send subscription message to server
    this.send({
      type: 'subscribe',
      event,
    });

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
          this.send({
            type: 'unsubscribe',
            event,
          });
        }
      }
    };
  }

  /**
   * Send message to server
   */
  private send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: any) {
    const { event, data } = message;
    const callbacks = this.listeners.get(event);

    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }
}

/**
 * Create singleton realtime client instance
 */
export const realtimeClient = new RealtimeClient();

/**
 * Error handler
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
