import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Helper to safely fetch local storage items
const getStoredToken = () => localStorage.getItem('collab_token');
const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('collab_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  
  login: (user, token) => {
    localStorage.setItem('collab_token', token);
    localStorage.setItem('collab_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('collab_token');
    localStorage.removeItem('collab_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
