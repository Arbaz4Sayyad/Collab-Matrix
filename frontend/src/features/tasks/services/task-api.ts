import { api } from '../../../shared/services/api';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeId?: string;
  reporterId?: string;
  projectId?: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

// Fallback high-fidelity mocks to support standalone premium UI operations
let mockTasks: Task[] = [
  {
    id: 'fc2f362a-bad0-4415-af56-3911e0c4a1d7',
    title: 'Implement CDC outbox thread replication',
    description: 'Establish transactional outbox poller executing Kafka record writes asynchronously.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assigneeId: '3874f225-7e1f-4a24-ba45-0c21b1ee02df',
    reporterId: '3874f225-7e1f-4a24-ba45-0c21b1ee02df',
    projectId: 'ed4b794b-f22e-4bcc-837a-5870bb0195d7',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b52a1a8c-9824-4f06-8c43-1678129df495',
    title: 'Scaffold Zustand real-time synchronization',
    description: 'Integrate custom STOMP connection listeners into React layout shells.',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '3874f225-7e1f-4a24-ba45-0c21b1ee02df',
    version: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'e62a129d-48ef-4fa6-ba45-ef291823ab12',
    title: 'Optimize Redis cache query miss pipelines',
    description: 'Avoid key-drift latency issues under heavy concurrent task query searches.',
    status: 'DONE',
    priority: 'LOW',
    assigneeId: '3874f225-7e1f-4a24-ba45-0c21b1ee02df',
    version: 2,
    createdAt: new Date().toISOString(),
  }
];

let mockComments: Comment[] = [
  {
    id: 'c1',
    taskId: 'fc2f362a-bad0-4415-af56-3911e0c4a1d7',
    authorName: 'Lead Architect',
    content: 'Ensure Kafka json.trusted.packages wildcards are configured properly before deployment.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  }
];

export const taskApi = {
  // Fetch all tasks for active project
  getTasks: async (projectId: string): Promise<Task[]> => {
    try {
      const res = await api.get(`/projects/${projectId}/tasks`);
      return res.data?.data || res.data;
    } catch {
      console.warn('[API Fallback] Fetching mock tasks.');
      return Promise.resolve(mockTasks);
    }
  },

  // Create a new task
  createTask: async (projectId: string, task: Omit<Task, 'id' | 'version'>): Promise<Task> => {
    try {
      const res = await api.post(`/projects/${projectId}/tasks`, task);
      return res.data?.data || res.data;
    } catch {
      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        version: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTasks.push(newTask);
      return Promise.resolve(newTask);
    }
  },

  // Update task details
  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    try {
      const keys = Object.keys(updates);
      if (keys.every(k => k === 'status' || k === 'version' || k === 'assigneeId')) {
        const version = updates.version ?? 0;
        const res = await api.patch(`/tasks/${taskId}/status?status=${updates.status}&version=${version}`);
        return res.data?.data || res.data;
      }
      const res = await api.put(`/tasks/${taskId}`, updates);
      return res.data?.data || res.data;
    } catch (err) {
      const idx = mockTasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        mockTasks[idx] = {
          ...mockTasks[idx],
          ...updates,
          version: mockTasks[idx].version + 1,
          updatedAt: new Date().toISOString()
        };
        return Promise.resolve(mockTasks[idx]);
      }
      throw err;
    }
  },

  // Get task comments
  getComments: async (taskId: string): Promise<Comment[]> => {
    try {
      const res = await api.get(`/tasks/${taskId}/comments`);
      return res.data?.data || res.data;
    } catch {
      return Promise.resolve(mockComments.filter(c => c.taskId === taskId));
    }
  },

  // Post task comment
  addComment: async (taskId: string, authorName: string, content: string): Promise<Comment> => {
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, { authorName, content });
      return res.data?.data || res.data;
    } catch {
      const newComment: Comment = {
        id: crypto.randomUUID(),
        taskId,
        authorName,
        content,
        createdAt: new Date().toISOString()
      };
      mockComments.push(newComment);
      return Promise.resolve(newComment);
    }
  }
};
