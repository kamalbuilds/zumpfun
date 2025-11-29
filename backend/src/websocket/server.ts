/**
 * WebSocket Server
 * Real-time updates for price changes, contributions, and events
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import config from '../config.js';
import logger from '../utils/logger.js';

interface WSMessage {
  type: string;
  data: any;
}

interface Subscription {
  token?: string;
  launch?: string;
  event?: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, Subscription> = new Map();

  initialize(server: Server): void {
    if (!config.websocket.enabled) {
      logger.info('WebSocket server is disabled');
      return;
    }

    this.wss = new WebSocketServer({
      server,
      path: config.websocket.path,
    });

    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('WebSocket client connected');
      this.clients.set(ws, {});

      ws.on('message', (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          logger.error('Invalid WebSocket message:', { error });
          ws.send(
            JSON.stringify({
              type: 'error',
              data: { message: 'Invalid message format' },
            })
          );
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', { error });
        this.clients.delete(ws);
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'connected',
          data: { message: 'ZumpFun WebSocket connected' },
        })
      );
    });

    logger.info('WebSocket server initialized', {
      path: config.websocket.path,
    });
  }

  private handleMessage(ws: WebSocket, message: WSMessage): void {
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(ws, message.data);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(ws, message.data);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', data: {} }));
        break;
      default:
        ws.send(
          JSON.stringify({
            type: 'error',
            data: { message: `Unknown message type: ${message.type}` },
          })
        );
    }
  }

  private handleSubscribe(ws: WebSocket, data: any): void {
    const subscription = this.clients.get(ws) || {};

    if (data.token) {
      subscription.token = data.token;
    }

    if (data.launch) {
      subscription.launch = data.launch;
    }

    if (data.event) {
      subscription.event = data.event;
    }

    this.clients.set(ws, subscription);

    ws.send(
      JSON.stringify({
        type: 'subscribed',
        data: subscription,
      })
    );

    logger.info('Client subscribed', { subscription });
  }

  private handleUnsubscribe(ws: WebSocket, data: any): void {
    const subscription = this.clients.get(ws) || {};

    if (data.token) {
      delete subscription.token;
    }

    if (data.launch) {
      delete subscription.launch;
    }

    if (data.event) {
      delete subscription.event;
    }

    this.clients.set(ws, subscription);

    ws.send(
      JSON.stringify({
        type: 'unsubscribed',
        data: subscription,
      })
    );

    logger.info('Client unsubscribed', { subscription });
  }

  /**
   * Broadcast price update to subscribed clients
   */
  broadcastPriceUpdate(tokenAddress: string, data: any): void {
    this.broadcast('price_update', data, (sub) => sub.token === tokenAddress);
  }

  /**
   * Broadcast new contribution to subscribed clients
   */
  broadcastContribution(launchId: string, data: any): void {
    this.broadcast('contribution', data, (sub) => sub.launch === launchId);
  }

  /**
   * Broadcast AMM graduation
   */
  broadcastGraduation(tokenAddress: string, data: any): void {
    this.broadcast('graduation', data, (sub) => sub.token === tokenAddress);
  }

  /**
   * Broadcast event to subscribed clients
   */
  broadcast(
    type: string,
    data: any,
    filter?: (subscription: Subscription) => boolean
  ): void {
    if (!this.wss) return;

    const message = JSON.stringify({ type, data, timestamp: Date.now() });

    this.clients.forEach((subscription, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        if (!filter || filter(subscription)) {
          ws.send(message);
        }
      }
    });

    logger.debug('Broadcast sent', { type, clients: this.clients.size });
  }

  /**
   * Close all connections
   */
  close(): void {
    if (!this.wss) return;

    this.clients.forEach((_, ws) => {
      ws.close();
    });

    this.wss.close();
    logger.info('WebSocket server closed');
  }
}

export const wsManager = new WebSocketManager();
export default wsManager;
