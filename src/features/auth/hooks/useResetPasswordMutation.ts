import { useMutation } from '@tanstack/react-query';

import { resetPassword } from '@/features/auth/api/auth.api';
import type { ResetPasswordInput } from '@/features/auth/model/auth.types';

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: async (input: ResetPasswordInput) => resetPassword(input),
  });
};
