import { api } from '../../../shared/services/api';

export interface Document {
  id: string;
  title: string;
  content: string;
  updatedBy: string;
  updatedAt: string;
}

export interface DocumentUser {
  username: string;
  color: string;
  cursorIndex: number;
}

let mockDocument: Document = {
  id: 'cme-spec-doc-2026',
  title: 'CME High-Latency Transaction Outbox Specification',
  content: `<h1>CME High-Latency Transaction Outbox Specification</h1>
<p>This document details the architectural guidelines for coordinating transactional outbox tables in our Spring Boot Postgres setups.</p>
<h2>1. Database Poller Engine</h2>
<p>The scheduler polls the <code>outbox_events</code> table every 50ms using transactional SELECT ... FOR UPDATE SKIP LOCKED queues to guarantee zero concurrency race conditions.</p>
<h2>2. Kafka Publisher Flow</h2>
<p>Events are pushed to the target CDC topic with a 99.999% durability target. Reconnections execute backoff retries immediately upon broker heartbeat failures.</p>`,
  updatedBy: 'Staff Architect',
  updatedAt: new Date().toISOString()
};

export const docApi = {
  // Fetch active spec document
  getDocument: async (docId: string): Promise<Document> => {
    try {
      const res = await api.get(`/documents/${docId}`);
      return res.data?.data || res.data;
    } catch {
      console.warn('[API Fallback] Fetching mock document.');
      return Promise.resolve(mockDocument);
    }
  },

  // Save document details
  saveDocument: async (docId: string, updates: Partial<Document>): Promise<Document> => {
    try {
      const res = await api.patch(`/documents/${docId}`, updates);
      return res.data?.data || res.data;
    } catch {
      mockDocument = {
        ...mockDocument,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return Promise.resolve(mockDocument);
    }
  }
};
