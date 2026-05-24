import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role } from '@/shared/types/enums/role';

type UserRole = Role | null;

interface User {
  id: string;
  role: UserRole;
}

interface AuthState {
  token: string | null;
  user: User | null;

  // actions
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  updateAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      setAuth: (token, user) =>
        set({
          token,
          user,
        }),

      logout: () =>
        set({
          token: null,
          user: null,
        }),

      updateAccessToken: (token) =>
        set({
          token,
        }),
    }),
    {
      name: 'auth-store', // localStorage key
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
