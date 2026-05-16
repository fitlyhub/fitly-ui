import { Spin, Typography } from 'antd';
import type { ReactElement } from 'react';
import { useEffect, useState, useSyncExternalStore } from 'react';

import {
  authRoutes,
  getCurrentAppLocation,
  normalizeAuthRoute,
  replaceRoute,
  subscribeToNavigation,
} from '@/app/router/app-router';
import { visualClassConfig } from '@/app/config/visual';
import type { AuthLanguage } from '@/features/auth/model/auth.types';
import { LoginPage } from '@/features/auth/ui/LoginPage';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { resolveTenant, isSharedHost } from '@/features/tenant/api/tenant.api';
import { SelectTenantPage } from '@/features/tenant/ui/SelectTenantPage';
import { useTenantStore } from '@/features/tenant/store/useTenantStore';
import { WorkspaceShell } from '@/features/workspace/ui/WorkspaceShell';
import { getCurrentHost } from '@/shared/lib/runtime-location';

const authLanguageStorageKey = 'fitly-auth-language';

const getInitialAuthLanguage = (): AuthLanguage => {
  const storedLanguage = window.localStorage.getItem(authLanguageStorageKey);

  if (storedLanguage === 'en_US' || storedLanguage === 'vi_VN') {
    return storedLanguage;
  }

  return 'vi_VN';
};

export const App = (): ReactElement => {
  const session = useAuthStore((state) => state.session);
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  const setSelectedTenant = useTenantStore((state) => state.setSelectedTenant);
  const clearSelectedTenant = useTenantStore((state) => state.clearSelectedTenant);
  const appLocation = useSyncExternalStore(
    subscribeToNavigation,
    getCurrentAppLocation,
    getCurrentAppLocation,
  );
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<'pending' | 'ready'>(
    'pending',
  );
  const [language, setLanguage] = useState<AuthLanguage>(getInitialAuthLanguage);
  const [resolvedHost, setResolvedHost] = useState<string | null>(null);
  const normalizedRoute = normalizeAuthRoute(appLocation.pathname);

  useEffect(() => {
    window.localStorage.setItem(authLanguageStorageKey, language);
  }, [language]);

  useEffect(() => {
    if (session) {
      setBootstrapStatus('ready');
      return;
    }

    const currentHost = getCurrentHost();
    const usingSharedHost = isSharedHost(currentHost);
    let isCancelled = false;

    const syncRoute = async () => {
      setBootstrapStatus('pending');

      if (!usingSharedHost) {
        if (selectedTenant?.resolvedBy === 'DOMAIN' && resolvedHost === currentHost) {
          if (appLocation.pathname !== authRoutes.login) {
            replaceRoute(authRoutes.login, appLocation.search);
          }

          setBootstrapError(null);
          setBootstrapStatus('ready');
          return;
        }

        try {
          const tenant = await resolveTenant({ host: currentHost });

          if (isCancelled) {
            return;
          }

          setSelectedTenant(tenant);
          setResolvedHost(currentHost);
          setBootstrapError(null);

          if (appLocation.pathname !== authRoutes.login) {
            replaceRoute(authRoutes.login, appLocation.search);
          }
        } catch (error) {
          if (isCancelled) {
            return;
          }

          clearSelectedTenant();
          setResolvedHost(null);
          setBootstrapError(
            error instanceof Error
              ? error.message
              : 'Không thể xác định tenant từ domain hiện tại.',
          );

          if (appLocation.pathname !== authRoutes.selectTenant) {
            replaceRoute(authRoutes.selectTenant);
          }
        } finally {
          if (!isCancelled) {
            setBootstrapStatus('ready');
          }
        }

        return;
      }

      setResolvedHost(null);

      if (appLocation.pathname === '/') {
        replaceRoute(selectedTenant ? authRoutes.login : authRoutes.selectTenant);
      } else if (
        appLocation.pathname !== authRoutes.login &&
        appLocation.pathname !== authRoutes.selectTenant
      ) {
        replaceRoute(selectedTenant ? authRoutes.login : authRoutes.selectTenant);
      } else if (normalizedRoute === authRoutes.login && !selectedTenant) {
        replaceRoute(authRoutes.selectTenant);
      }

      setBootstrapError(null);
      setBootstrapStatus('ready');
    };

    void syncRoute();

    return () => {
      isCancelled = true;
    };
  }, [
    appLocation.pathname,
    appLocation.search,
    clearSelectedTenant,
    normalizedRoute,
    resolvedHost,
    selectedTenant,
    session,
    setSelectedTenant,
  ]);

  if (session) {
    return (
      <WorkspaceShell
        language={language}
        onChangeLanguage={setLanguage}
      />
    );
  }

  if (bootstrapStatus === 'pending') {
    return (
      <main className={`flex min-h-screen items-center justify-center px-4 ${visualClassConfig.shell.authBackground}`}>
        <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-slate-200 bg-white px-10 py-12 shadow-[0_24px_64px_rgba(15,23,42,0.12)]">
          <Spin size="large" />
          <Typography.Text className="text-slate-600">
            Đang xác định công ty...
          </Typography.Text>
        </div>
      </main>
    );
  }

  if (!selectedTenant || normalizedRoute === authRoutes.selectTenant) {
    return (
      <SelectTenantPage
        bootstrapError={bootstrapError}
        language={language}
        onLanguageChange={setLanguage}
      />
    );
  }

  return (
    <LoginPage
      canChangeTenant={selectedTenant.resolvedBy === 'USER_INPUT'}
      language={language}
      onChangeLanguage={setLanguage}
      onChangeTenant={() => {
        clearSelectedTenant();
        replaceRoute(authRoutes.selectTenant);
      }}
      selectedTenant={selectedTenant}
    />
  );
};
