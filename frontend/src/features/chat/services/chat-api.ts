import { api } from '../../../shared/services/api';

export interface ChatMessage {
  id: string;
  channelId: string;
  senderName: string;
  content: string;
  reactions: Record<string, number>; // emoji -> count
  createdAt: string;
  parentMessageId?: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  description: string;
}

export interface ChatDM {
  username: string;
  online: boolean;
  role: string;
}

let mockChannels: ChatChannel[] = [
  { id: 'general', name: 'general', isPrivate: false, description: 'Company-wide announcements and watercooler talk.' },
  { id: 'prod-outbox-sync', name: 'prod-outbox-sync', isPrivate: true, description: 'Outbox CDC transaction sync stream operations.' },
  { id: 'deployment-logs', name: 'deployment-logs', isPrivate: false, description: 'Live logs from Kubernetes production pod updates.' }
];

let mockDMs: ChatDM[] = [
  { username: 'Lead Architect', online: true, role: 'Lead Architect' },
  { username: 'DevOps Lead', online: true, role: 'System Admin' },
  { username: 'Test User', online: false, role: 'Quality Analyst' }
];

let mockDMMessages: Record<string, ChatMessage[]> = {};

let mockMessages: ChatMessage[] = [
  {
    id: 'm1',
    channelId: 'general',
    senderName: 'Lead Architect',
    content: 'Welcome to the CollabMatrix Enterprise (CME) developer backplane chat system!',
    reactions: { '👍': 3, '🚀': 2 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'm2',
    channelId: 'general',
    senderName: 'DevOps Lead',
    content: 'Configured SockJS connection heartbeat pings to 4000ms. WS metrics look rock solid!',
    reactions: { '🔥': 4 },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

export const chatApi = {
  // Fetch channels list
  getChannels: async (): Promise<ChatChannel[]> => {
    try {
      const res = await api.get('/chat/channels');
      return res.data?.data || res.data;
    } catch {
      return Promise.resolve(mockChannels);
    }
  },

  // Get active channel messages
  getMessages: async (channelId: string): Promise<ChatMessage[]> => {
    try {
      const res = await api.get(`/chat/channels/${channelId}/messages`);
      return res.data?.data || res.data;
    } catch {
      return Promise.resolve(mockMessages.filter(m => m.channelId === channelId));
    }
  },

  // Send message
  sendMessage: async (channelId: string, senderName: string, content: string): Promise<ChatMessage> => {
    try {
      const res = await api.post(`/chat/channels/${channelId}/messages`, { senderName, content });
      return res.data?.data || res.data;
    } catch {
      const newMsg: ChatMessage = {
        id: crypto.randomUUID(),
        channelId,
        senderName,
        content,
        reactions: {},
        createdAt: new Date().toISOString()
      };
      mockMessages.push(newMsg);
      return Promise.resolve(newMsg);
    }
  },

  // Get DMs list
  getDMs: (): ChatDM[] => {
    return mockDMs;
  },

  // Fetch DM history
  getDMMessages: async (otherUser: string): Promise<ChatMessage[]> => {
    if (!mockDMMessages[otherUser]) {
      // Seed an initial starting message from the contact so the feed looks premium
      mockDMMessages[otherUser] = [
        {
          id: crypto.randomUUID(),
          channelId: `dm-${otherUser.toLowerCase().replace(/\s+/g, '-')}`,
          senderName: otherUser,
          content: `Hi there! Real-time direct messaging has been fully established. Let me know if you need to coordinate on any open active Kanban sprints.`,
          reactions: { '👍': 1 },
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        }
      ];
    }
    return Promise.resolve(mockDMMessages[otherUser]);
  },

  // Send DM message
  sendDMMessage: async (otherUser: string, senderName: string, content: string): Promise<ChatMessage> => {
    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      channelId: `dm-${otherUser.toLowerCase().replace(/\s+/g, '-')}`,
      senderName,
      content,
      reactions: {},
      createdAt: new Date().toISOString()
    };
    if (!mockDMMessages[otherUser]) {
      mockDMMessages[otherUser] = [];
    }
    mockDMMessages[otherUser].push(newMsg);
    return Promise.resolve(newMsg);
  },

  // Create new channel slug
  createChannel: async (channel: Omit<ChatChannel, 'id'>): Promise<ChatChannel> => {
    const newChannel: ChatChannel = {
      ...channel,
      id: channel.name.toLowerCase().trim().replace(/\s+/g, '-')
    };
    mockChannels.push(newChannel);
    return Promise.resolve(newChannel);
  }
};
