import { create } from 'zustand';

import type { DynamicFormValues } from '@/engines/dynamic-form';
import type { WorkspaceModuleKey } from '@/features/workspace/model/workspace.types';

interface WorkspaceState {
  activeModuleKey: WorkspaceModuleKey;
  formSubmissions: Record<string, DynamicFormValues | null>;
  openModuleKeys: WorkspaceModuleKey[];
  closeModuleTab: (moduleKey: WorkspaceModuleKey) => void;
  setActiveModule: (moduleKey: WorkspaceModuleKey) => void;
  setFormSubmission: (formId: string, values: DynamicFormValues) => void;
  resetWorkspace: () => void;
}

const createWorkspaceState = (): Pick<
  WorkspaceState,
  'activeModuleKey' | 'formSubmissions' | 'openModuleKeys'
> => ({
  activeModuleKey: 'dashboard',
  formSubmissions: {},
  openModuleKeys: ['dashboard'],
});

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  ...createWorkspaceState(),
  closeModuleTab: (moduleKey) => {
    set((state) => {
      const nextOpenModuleKeys = state.openModuleKeys.filter(
        (openModuleKey) => openModuleKey !== moduleKey,
      );

      if (nextOpenModuleKeys.length === 0) {
        return {
          activeModuleKey: 'dashboard',
          openModuleKeys: ['dashboard'],
        };
      }

      if (state.activeModuleKey !== moduleKey) {
        return {
          openModuleKeys: nextOpenModuleKeys,
        };
      }

      const closedTabIndex = state.openModuleKeys.indexOf(moduleKey);
      const nextActiveModuleKey =
        nextOpenModuleKeys[Math.max(0, closedTabIndex - 1)] ??
        nextOpenModuleKeys[0];

      return {
        activeModuleKey: nextActiveModuleKey,
        openModuleKeys: nextOpenModuleKeys,
      };
    });
  },
  setActiveModule: (moduleKey) => {
    set((state) => ({
      activeModuleKey: moduleKey,
      openModuleKeys: state.openModuleKeys.includes(moduleKey)
        ? state.openModuleKeys
        : [...state.openModuleKeys, moduleKey],
    }));
  },
  setFormSubmission: (formId, values) => {
    set((state) => ({
      formSubmissions: {
        ...state.formSubmissions,
        [formId]: values,
      },
    }));
  },
  resetWorkspace: () => {
    set(createWorkspaceState());
  },
}));

export const resetWorkspaceStore = (): void => {
  useWorkspaceStore.setState(createWorkspaceState());
};
