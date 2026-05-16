import { useQuery } from '@tanstack/react-query';

import { fetchWorkspaceNavigation } from '@/features/workspace/api/workspace.api';

export const useWorkspaceNavigationQuery = () => {
  return useQuery({
    queryKey: ['workspace-navigation'],
    queryFn: fetchWorkspaceNavigation,
    staleTime: 60_000,
  });
};
