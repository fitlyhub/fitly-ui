import { useQuery } from '@tanstack/react-query';

import { fetchWorkspaceModule } from '@/features/workspace/api/workspace.api';
import type { WorkspaceModuleKey } from '@/features/workspace/model/workspace.types';

export const useWorkspaceModuleQuery = (moduleKey: WorkspaceModuleKey) => {
  return useQuery({
    queryKey: ['workspace-module', moduleKey],
    queryFn: () => fetchWorkspaceModule(moduleKey),
    staleTime: 60_000,
  });
};
