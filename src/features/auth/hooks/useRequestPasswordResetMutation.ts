import { useMutation } from '@tanstack/react-query';

import { requestPasswordReset } from '@/features/auth/api/auth.api';
import type { PasswordResetRequestInput } from '@/features/auth/model/auth.types';

export const useRequestPasswordResetMutation = () => {
  return useMutation({
    mutationFn: async (input: PasswordResetRequestInput) =>
      requestPasswordReset(input),
  });
};
