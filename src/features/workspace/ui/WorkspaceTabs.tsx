import { Button, Tooltip } from 'antd';
import type { ReactElement } from 'react';

import { CloseOutlined } from '@/app/config/visual';
import type {
  WorkspaceModuleKey,
  WorkspaceNavItem,
} from '@/features/workspace/model/workspace.types';

interface WorkspaceTabsProps {
  activeModuleKey: WorkspaceModuleKey;
  items: WorkspaceNavItem[];
  openModuleKeys: WorkspaceModuleKey[];
  onCloseTab: (moduleKey: WorkspaceModuleKey) => void;
  onSelectTab: (moduleKey: WorkspaceModuleKey) => void;
}

const findNavigationLabel = (
  items: WorkspaceNavItem[],
  moduleKey: WorkspaceModuleKey,
): string | null => {
  for (const item of items) {
    if (item.moduleKey === moduleKey) {
      return item.label;
    }

    if (item.children) {
      const childLabel = findNavigationLabel(item.children, moduleKey);

      if (childLabel) {
        return childLabel;
      }
    }
  }

  return null;
};

const fallbackLabelMap: Record<WorkspaceModuleKey, string> = {
  'access-control': 'Access Control',
  customers: 'Customers',
  dashboard: 'Dashboard',
  employees: 'Employees',
  finance: 'Finance',
  'finance-invoices': 'Invoices',
  invoices: 'Invoice',
  organization: 'Organization',
  'price-list': 'Price List',
  products: 'Products',
  'purchase-orders': 'Purchase Orders',
  'purchase-requests': 'Purchase Request',
  'sales-invoices': 'Sales Invoice',
  'sales-orders': 'Sales Order',
  'stock-transfers': 'Stock Transfer',
  vendors: 'Vendors',
  warehouse: 'Inventory',
};

export const WorkspaceTabs = ({
  activeModuleKey,
  items,
  openModuleKeys,
  onCloseTab,
  onSelectTab,
}: WorkspaceTabsProps): ReactElement => {
  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-4 sm:px-5 lg:px-7">
      <div
        aria-label="Open workspace tabs"
        className="flex min-w-0 gap-1 overflow-x-auto pt-2"
        role="tablist"
      >
        {openModuleKeys.map((moduleKey) => {
          const isActive = moduleKey === activeModuleKey;
          const label =
            findNavigationLabel(items, moduleKey) ?? fallbackLabelMap[moduleKey];

          return (
            <div
              key={moduleKey}
              className={[
                'group flex h-10 max-w-[220px] shrink-0 items-center gap-1 rounded-t-md border border-b-0 px-3 text-sm transition',
                isActive
                  ? 'border-slate-200 bg-[var(--color-fitly-app-shell)] text-slate-950 shadow-[inset_0_2px_0_var(--color-fitly-accent)]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950',
              ].join(' ')}
              role="presentation"
            >
              <button
                aria-selected={isActive}
                className="min-w-0 flex-1 cursor-pointer truncate border-0 bg-transparent p-0 text-left font-medium"
                role="tab"
                type="button"
                onClick={() => {
                  onSelectTab(moduleKey);
                }}
              >
                {label}
              </button>
              <Tooltip title={`Close ${label}`}>
                <Button
                  aria-label={`Close ${label}`}
                  className="!h-6 !w-6 !shrink-0 !rounded !border-0 !bg-transparent !text-slate-400 hover:!bg-slate-200 hover:!text-slate-700"
                  icon={<CloseOutlined />}
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCloseTab(moduleKey);
                  }}
                />
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
};
