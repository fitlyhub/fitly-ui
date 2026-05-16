import { useQuery } from '@tanstack/react-query';

import { verifyPasswordResetToken } from '@/features/auth/api/auth.api';

export const usePasswordResetTokenQuery = (token: string | null) => {
  return useQuery({
    enabled: Boolean(token),
    queryFn: () => verifyPasswordResetToken(token as string),
    queryKey: ['auth', 'password-reset-token', token],
    retry: false,
    staleTime: 0,
  });
};
