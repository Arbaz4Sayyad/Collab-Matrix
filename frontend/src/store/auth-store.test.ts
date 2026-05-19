import { describe, it, expect, beforeEach, vi } from 'vitest';

// Pre-emptively mock localStorage before auth-store is loaded at import time
const mockStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStore[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStore[key]; }),
  clear: vi.fn(() => { for (const k in mockStore) { delete mockStore[k]; } })
};
vi.stubGlobal('localStorage', mockLocalStorage);

describe('useAuthStore - Zustand Global Security Session Session Store', () => {
  let useAuthStore: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Dynamically import the store so that the localStorage stub is already registered
    const module = await import('./auth-store');
    useAuthStore = module.useAuthStore;
    
    // Clear Zustand store state manually
    useAuthStore.getState().logout();
  });

  it('should initialize with secure default states (null user, not authenticated)', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should transition login successfully and cache session details in localStorage', () => {
    const mockUser = {
      id: 'usr-9001',
      username: 'Staff Architect',
      email: 'architect@collabmatrix.io'
    };
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

    // Dispatch login transaction
    useAuthStore.getState().login(mockUser, mockToken);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe(mockToken);
    expect(state.isAuthenticated).toBe(true);

    // Verify localStorage persistence triggers
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('collab_token', mockToken);
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('collab_user', JSON.stringify(mockUser));
  });

  it('should trigger logout cleanly and flush active session states from localStorage', () => {
    const mockUser = {
      id: 'usr-9002',
      username: 'DevOps Lead',
      email: 'devops@collabmatrix.io'
    };
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9-part2';

    // Login first
    useAuthStore.getState().login(mockUser, mockToken);
    
    // Logout transaction
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    // Verify localStorage item cleanups
    expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('collab_token');
    expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('collab_user');
  });

});
