import { Button, Input, Skeleton } from 'antd';
import type { ReactElement } from 'react';
import { startTransition, useEffect, useMemo, useState } from 'react';

import {
  brandConfig,
  DownOutlined,
  getWorkspaceNavigationIcon,
  logoClassConfig,
  logoImageConfig,
  MenuOutlined,
  SearchOutlined,
} from '@/app/config/visual';
import type {
  WorkspaceModuleKey,
  WorkspaceNavItem,
} from '@/features/workspace/model/workspace.types';

interface WorkspaceSidebarProps {
  activeModuleKey: WorkspaceModuleKey;
  items: WorkspaceNavItem[];
  isLoading: boolean;
  onCollapse: () => void;
  onSelectModule: (moduleKey: WorkspaceModuleKey) => void;
}

const normalizeSearchValue = (value: string): string => {
  return value.trim().toLocaleLowerCase();
};

const doesItemMatchSearch = (
  item: WorkspaceNavItem,
  searchValue: string,
): boolean => {
  const searchableText = [
    item.label,
    item.description,
    item.key,
  ].join(' ');

  return searchableText.toLocaleLowerCase().includes(searchValue);
};

export const WorkspaceSidebar = ({
  activeModuleKey,
  items,
  isLoading,
  onCollapse,
  onSelectModule,
}: WorkspaceSidebarProps): ReactElement => {
  const [searchValue, setSearchValue] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(items.filter((item) => item.children?.length).map((item) => item.key)),
  );
  const normalizedSearchValue = normalizeSearchValue(searchValue);

  useEffect(() => {
    setOpenGroups((currentValue) => {
      if (currentValue.size > 0) {
        return currentValue;
      }

      return new Set(items.filter((item) => item.children?.length).map((item) => item.key));
    });
  }, [items]);

  const selectedPath = useMemo(() => {
    const path = new Set<string>();

    const walk = (navItems: WorkspaceNavItem[], ancestors: string[]): boolean => {
      return navItems.some((item) => {
        const currentPath = [...ancestors, item.key];

        if (item.moduleKey === activeModuleKey) {
          currentPath.forEach((key) => {
            path.add(key);
          });
          return true;
        }

        return item.children ? walk(item.children, currentPath) : false;
      });
    };

    walk(items, []);

    return path;
  }, [activeModuleKey, items]);

  const filteredItems = useMemo(() => {
    if (!normalizedSearchValue) {
      return items;
    }

    const filterItems = (navItems: WorkspaceNavItem[]): WorkspaceNavItem[] => {
      return navItems.reduce<WorkspaceNavItem[]>((result, item) => {
        const children = item.children ? filterItems(item.children) : [];
        const matchesSearch = doesItemMatchSearch(item, normalizedSearchValue);

        if (!matchesSearch && children.length === 0) {
          return result;
        }

        result.push({
          ...item,
          children: matchesSearch ? item.children : children,
        });

        return result;
      }, []);
    };

    return filterItems(items);
  }, [items, normalizedSearchValue]);

  const toggleGroup = (itemKey: string): void => {
    setOpenGroups((currentValue) => {
      const nextValue = new Set(currentValue);

      if (nextValue.has(itemKey)) {
        nextValue.delete(itemKey);
      } else {
        nextValue.add(itemKey);
      }

      return nextValue;
    });
  };

  const renderNavigationItem = (item: WorkspaceNavItem, depth = 0): ReactElement => {
    const hasChildren = Boolean(item.children?.length);
    const isGroupOpen = normalizedSearchValue
      ? hasChildren
      : openGroups.has(item.key) || selectedPath.has(item.key);
    const isActive = item.moduleKey === activeModuleKey;
    const isDisabled = item.disabled || (!hasChildren && !item.moduleKey);
    const moduleIcon = getWorkspaceNavigationIcon(item);

    return (
      <div key={item.key}>
        <button
          aria-current={isActive ? 'page' : undefined}
          aria-disabled={isDisabled || undefined}
          aria-expanded={hasChildren ? isGroupOpen : undefined}
          className={[
            'group flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition',
            isDisabled
              ? 'cursor-not-allowed text-slate-500'
              : isActive
              ? 'bg-teal-400/15 text-white ring-1 ring-teal-300/20'
              : selectedPath.has(item.key)
                ? 'bg-white/[0.07] text-white'
                : 'text-slate-200 hover:bg-white/[0.08] hover:text-white',
          ].join(' ')}
          style={{ paddingLeft: `${10 + depth * 18}px` }}
          type="button"
          onClick={() => {
            if (hasChildren) {
              toggleGroup(item.key);
              return;
            }

            if (!item.moduleKey || isDisabled) {
              return;
            }

            const moduleKey = item.moduleKey;

            startTransition(() => {
              onSelectModule(moduleKey);
            });
          }}
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center text-base text-teal-300/90">
            {moduleIcon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium leading-5">
              {item.label}
            </span>
            {depth === 0 ? (
              <span className="block truncate text-[11px] leading-4 text-slate-400">
                {item.description}
              </span>
            ) : null}
          </span>
          {hasChildren ? (
            <DownOutlined
              className={[
                'text-[10px] text-slate-400 transition-transform',
                isGroupOpen ? 'rotate-0' : '-rotate-90',
              ].join(' ')}
            />
          ) : null}
        </button>

        {hasChildren && isGroupOpen ? (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderNavigationItem(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <aside className="relative h-screen overflow-hidden border-b border-teal-900/50 bg-[var(--color-fitly-sidebar)] px-4 py-4 text-slate-100 shadow-[20px_0_48px_rgba(3,19,18,0.18)] lg:border-r lg:border-b-0">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={logoClassConfig.workspace.mark}>
              <img
                alt={logoImageConfig.icon.alt}
                className={logoClassConfig.workspace.markImage}
                src={logoImageConfig.icon.src}
              />
            </div>
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-semibold uppercase leading-5 text-slate-100">
                {brandConfig.platformName}
              </p>
              <p className="m-0 truncate text-xs leading-4 text-slate-300">
                {brandConfig.workspaceName}
              </p>
            </div>
          </div>
          <Button
            aria-label="Hide workspace menu"
            className="!h-10 !w-10 !rounded-xl !border-teal-500/25 !bg-teal-500/35 !text-teal-100 hover:!border-teal-300 hover:!bg-teal-500/45 hover:!text-white"
            icon={<MenuOutlined />}
            onClick={onCollapse}
          />
        </div>

        <div className="mt-4 shrink-0">
          <Input
            allowClear
            aria-label="Search workspace menu"
            className="workspace-menu-search"
            placeholder="Tim kiem menu"
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
            }}
          />
        </div>

        <nav
          aria-label="Workspace menu"
          className="workspace-sidebar-scroll mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1"
        >
          {isLoading ? (
            <div className="space-y-3 px-1 pt-3">
              <Skeleton
                active
                className="workspace-sidebar-skeleton"
                paragraph={{ rows: 4 }}
                title={false}
              />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-400">
              Khong tim thay menu
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item) => renderNavigationItem(item))}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};
