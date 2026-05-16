import {
  getWorkspaceModule,
  workspaceNavigation,
} from '@/features/workspace/metadata/workspace.metadata';
import type {
  WorkspaceModuleKey,
  WorkspaceModuleSchema,
  WorkspaceNavItem,
} from '@/features/workspace/model/workspace.types';

const wait = async (durationMs: number): Promise<void> => {
  await new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
};

const getJson = async <TResponse>(url: string): Promise<TResponse | null> => {
  try {
    const response = await window.fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      method: 'GET',
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | TResponse
      | null;

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorMessage =
        payload &&
        typeof payload === 'object' &&
        'message' in payload &&
        typeof payload.message === 'string'
          ? payload.message
          : 'Unable to load workspace metadata.';

      throw new Error(errorMessage);
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof Error && error.name === 'TypeError') {
      return null;
    }

    throw error;
  }
};

export const fetchWorkspaceNavigation = async (): Promise<WorkspaceNavItem[]> => {
  await wait(120);

  const apiResponse = await getJson<WorkspaceNavItem[]>(
    '/api/workspace/navigation',
  );

  if (apiResponse) {
    return apiResponse;
  }

  return workspaceNavigation;
};

export const fetchWorkspaceModule = async (
  moduleKey: WorkspaceModuleKey,
): Promise<WorkspaceModuleSchema> => {
  await wait(160);

  const apiResponse = await getJson<WorkspaceModuleSchema>(
    `/api/workspace/modules/${encodeURIComponent(moduleKey)}`,
  );

  if (apiResponse) {
    return apiResponse;
  }

  const module = getWorkspaceModule(moduleKey);

  if (!module) {
    throw new Error(`Unknown module: ${moduleKey}`);
  }

  return module;
};
