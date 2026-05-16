import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TenantContext } from '@/features/tenant/model/tenant.types';

interface TenantState {
  clearSelectedTenant: () => void;
  selectedTenant: TenantContext | null;
  setSelectedTenant: (tenant: TenantContext) => void;
}

const createTenantState = (): Pick<TenantState, 'selectedTenant'> => ({
  selectedTenant: null,
});

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      ...createTenantState(),
      clearSelectedTenant: () => {
        set({ selectedTenant: null });
      },
      setSelectedTenant: (tenant) => {
        set({ selectedTenant: tenant });
      },
    }),
    {
      name: 'fitly-selected-tenant',
      partialize: (state) => ({
        selectedTenant: state.selectedTenant,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const resetTenantStore = (): void => {
  useTenantStore.setState(createTenantState());
};
