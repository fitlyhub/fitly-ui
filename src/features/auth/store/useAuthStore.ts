import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { UserSession } from '@/features/auth/model/auth.types';

interface AuthState {
  session: UserSession | null;
  signIn: (session: UserSession) => void;
  signOut: () => void;
}

const createAuthState = (): Pick<AuthState, 'session'> => ({
  session: null,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...createAuthState(),
      signIn: (session) => {
        set({ session });
      },
      signOut: () => {
        set({ session: null });
      },
    }),
    {
      name: 'fitly-auth-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
      }),
    },
  ),
);

export const resetAuthStore = (): void => {
  useAuthStore.setState(createAuthState());
};
