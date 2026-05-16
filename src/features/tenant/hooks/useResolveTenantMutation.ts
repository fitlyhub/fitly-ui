import { useMutation } from '@tanstack/react-query';

import { resolveTenant } from '@/features/tenant/api/tenant.api';
import type { ResolveTenantInput } from '@/features/tenant/model/tenant.types';

export const useResolveTenantMutation = () => {
  return useMutation({
    mutationFn: async (input: ResolveTenantInput) => resolveTenant(input),
  });
};
