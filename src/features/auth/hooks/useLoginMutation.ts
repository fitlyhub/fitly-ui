import { useMutation } from '@tanstack/react-query';

import { login } from '@/features/auth/api/auth.api';
import type { LoginPayload, UserSession } from '@/features/auth/model/auth.types';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { resetWorkspaceStore } from '@/features/workspace/store/useWorkspaceStore';

const resolveRole = (username: string): string => {
  if (username.startsWith('buyer')) {
    return 'Procurement Lead';
  }

  if (username.startsWith('hr')) {
    return 'People Operations';
  }

  return 'Operations Director';
};

const resolveName = (username: string): string => {
  const normalized = username
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

  return normalized || 'Fitly User';
};

const toUserSession = (response: Awaited<ReturnType<typeof login>>): UserSession => {
  return {
    accessToken: response.accessToken,
    email: response.user.username,
    id: response.user.userId,
    name: resolveName(response.user.username),
    refreshToken: response.refreshToken,
    role: resolveRole(response.user.username),
    tenantCode: response.tenant.tenantCode,
    tenantId: response.tenant.tenantId,
    tenantName: response.tenant.tenantName,
    userId: response.user.userId,
    username: response.user.username,
    workspace: response.tenant.tenantName,
  };
};

export const useLoginMutation = () => {
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: async (payload: LoginPayload) => login(payload),
    onSuccess: (response) => {
      resetWorkspaceStore();
      signIn(toUserSession(response));
    },
  });
};
