import type { DynamicPageSchema } from '@/engines/dynamic-page';

export type WorkspaceModuleKey =
  | 'customers'
  | 'dashboard'
  | 'employees'
  | 'finance'
  | 'finance-invoices'
  | 'invoices'
  | 'organization'
  | 'price-list'
  | 'products'
  | 'purchase-orders'
  | 'purchase-requests'
  | 'sales-invoices'
  | 'sales-orders'
  | 'stock-transfers'
  | 'vendors'
  | 'warehouse'
  | 'access-control';

export interface WorkspaceNavItem {
  key: string;
  label: string;
  description: string;
  disabled?: boolean;
  moduleKey?: WorkspaceModuleKey;
  children?: WorkspaceNavItem[];
}

export type WorkspaceModuleSchema = DynamicPageSchema & {
  moduleKey: WorkspaceModuleKey;
};
