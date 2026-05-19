import { Client } from '@stomp/stompjs';
import type { StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { create } from 'zustand';

interface WebSocketState {
  isConnected: boolean;
  setConnected: (status: boolean) => void;
}

// Global hook to monitor active WS connection states in the UI
export const useWebSocketStore = create<WebSocketState>((set) => ({
  isConnected: false,
  setConnected: (status) => set({ isConnected: status }),
}));

class WebSocketManager {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private connectionRetries = 0;
  private maxRetries = 10;

  public connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) {
        resolve();
        return;
      }

      const socketUrl = import.meta.env.VITE_WS_URL || '/ws';
      
      this.client = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          if (import.meta.env.DEV) console.log('[STOMP]', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = (frame) => {
        console.log('[WebSocket] Connected successfully!', frame);
        useWebSocketStore.getState().setConnected(true);
        this.connectionRetries = 0;
        resolve();
      };

      this.client.onStompError = (frame) => {
        console.error('[WebSocket] Broker reported error: ' + frame.headers['message']);
        console.error('[WebSocket] Additional details: ' + frame.body);
        reject(frame);
      };

      this.client.onDisconnect = () => {
        console.log('[WebSocket] Disconnected.');
        useWebSocketStore.getState().setConnected(false);
      };

      this.client.onWebSocketClose = () => {
        console.log('[WebSocket] Underlying socket connection closed.');
        useWebSocketStore.getState().setConnected(false);
        this.handleReconnect(token);
      };

      this.client.activate();
    });
  }

  private handleReconnect(token: string) {
    if (this.connectionRetries >= this.maxRetries) {
      console.error('[WebSocket] Max reconnection attempts reached.');
      return;
    }
    this.connectionRetries++;
    console.log(`[WebSocket] Reconnection attempt ${this.connectionRetries}/${this.maxRetries}...`);
    setTimeout(() => {
      this.connect(token).catch(() => {});
    }, 5000);
  }

  public subscribe(topic: string, callback: (message: any) => void) {
    if (!this.client || !this.client.connected) {
      console.warn('[WebSocket] Cannot subscribe, STOMP client is not connected.');
      return;
    }

    if (this.subscriptions.has(topic)) {
      return;
    }

    const sub = this.client.subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch {
        callback(message.body);
      }
    });

    this.subscriptions.set(topic, sub);
    console.log(`[WebSocket] Subscribed to topic: ${topic}`);
  }

  public unsubscribe(topic: string) {
    const sub = this.subscriptions.get(topic);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(topic);
      console.log(`[WebSocket] Unsubscribed from topic: ${topic}`);
    }
  }

  public send(destination: string, payload: any) {
    if (!this.client || !this.client.connected) {
      console.warn('[WebSocket] Cannot send, STOMP client is not connected.');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(payload),
    });
  }

  public disconnect() {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
      useWebSocketStore.getState().setConnected(false);
      console.log('[WebSocket] Terminated.');
    }
  }
}

export const wsManager = new WebSocketManager();
