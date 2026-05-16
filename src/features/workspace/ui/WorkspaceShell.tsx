import type { ReactElement } from 'react';
import { useState } from 'react';

import { visualClassConfig } from '@/app/config/visual';
import type { AuthLanguage } from '@/features/auth/model/auth.types';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useWorkspaceModuleQuery } from '@/features/workspace/hooks/useWorkspaceModuleQuery';
import { useWorkspaceNavigationQuery } from '@/features/workspace/hooks/useWorkspaceNavigationQuery';
import { resetWorkspaceStore, useWorkspaceStore } from '@/features/workspace/store/useWorkspaceStore';
import { WorkspaceContent } from '@/features/workspace/ui/WorkspaceContent';
import { WorkspaceHeader } from '@/features/workspace/ui/WorkspaceHeader';
import { WorkspaceSidebar } from '@/features/workspace/ui/WorkspaceSidebar';
import { WorkspaceTabs } from '@/features/workspace/ui/WorkspaceTabs';

interface WorkspaceShellProps {
  language: AuthLanguage;
  onChangeLanguage: (language: AuthLanguage) => void;
}

export const WorkspaceShell = ({
  language,
  onChangeLanguage,
}: WorkspaceShellProps): ReactElement => {
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const activeModuleKey = useWorkspaceStore((state) => state.activeModuleKey);
  const closeModuleTab = useWorkspaceStore((state) => state.closeModuleTab);
  const openModuleKeys = useWorkspaceStore((state) => state.openModuleKeys);
  const setActiveModule = useWorkspaceStore((state) => state.setActiveModule);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigationQuery = useWorkspaceNavigationQuery();
  const moduleQuery = useWorkspaceModuleQuery(activeModuleKey);

  if (!session) {
    return <></>;
  }

  const handleSignOut = (): void => {
    resetWorkspaceStore();
    signOut();
  };

  const shellGridClassName = sidebarCollapsed
    ? 'grid h-screen overflow-hidden'
    : 'grid h-screen overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)]';

  return (
    <div className={`h-screen overflow-hidden ${visualClassConfig.shell.workspaceBackground}`}>
      <div className={shellGridClassName}>
        {!sidebarCollapsed ? (
          <WorkspaceSidebar
            activeModuleKey={activeModuleKey}
            isLoading={navigationQuery.isLoading}
            items={navigationQuery.data ?? []}
            onCollapse={() => {
              setSidebarCollapsed(true);
            }}
            onSelectModule={setActiveModule}
          />
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <WorkspaceHeader
            isSidebarCollapsed={sidebarCollapsed}
            language={language}
            module={moduleQuery.data}
            session={session}
            onChangeLanguage={onChangeLanguage}
            onSignOut={handleSignOut}
            onToggleSidebar={() => {
              setSidebarCollapsed((currentValue) => !currentValue);
            }}
          />

          <WorkspaceTabs
            activeModuleKey={activeModuleKey}
            items={navigationQuery.data ?? []}
            openModuleKeys={openModuleKeys}
            onCloseTab={closeModuleTab}
            onSelectTab={setActiveModule}
          />

          <main className="min-h-0 flex-1 overflow-auto px-4 pb-1 sm:px-5 lg:px-7">
            <WorkspaceContent
              errorMessage={moduleQuery.error?.message}
              isLoading={moduleQuery.isLoading}
              module={moduleQuery.data}
            />
          </main>
        </div>
      </div>
    </div>
  );
};
