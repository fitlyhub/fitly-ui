const navigationEventName = 'fitly:navigation-change';

export const authRoutes = {
  login: '/login',
  selectTenant: '/select-tenant',
} as const;

export type AuthRoutePath = (typeof authRoutes)[keyof typeof authRoutes];

export interface AppLocationSnapshot {
  pathname: string;
  search: string;
}

let cachedLocationSnapshot: AppLocationSnapshot = {
  pathname: window.location.pathname,
  search: window.location.search,
};

const emitNavigationEvent = (): void => {
  window.dispatchEvent(new Event(navigationEventName));
};

export const getCurrentAppLocation = (): AppLocationSnapshot => {
  const pathname = window.location.pathname;
  const search = window.location.search;

  if (
    cachedLocationSnapshot.pathname === pathname &&
    cachedLocationSnapshot.search === search
  ) {
    return cachedLocationSnapshot;
  }

  cachedLocationSnapshot = {
    pathname,
    search,
  };

  return cachedLocationSnapshot;
};

export const navigateTo = (pathname: string, search = ''): void => {
  const target = `${pathname}${search}`;

  if (`${window.location.pathname}${window.location.search}` === target) {
    return;
  }

  window.history.pushState({}, '', target);
  emitNavigationEvent();
};

export const replaceRoute = (pathname: string, search = ''): void => {
  const target = `${pathname}${search}`;

  if (`${window.location.pathname}${window.location.search}` === target) {
    return;
  }

  window.history.replaceState({}, '', target);
  emitNavigationEvent();
};

export const subscribeToNavigation = (listener: () => void): (() => void) => {
  const eventListener = (): void => {
    listener();
  };

  window.addEventListener('popstate', eventListener);
  window.addEventListener(navigationEventName, eventListener);

  return () => {
    window.removeEventListener('popstate', eventListener);
    window.removeEventListener(navigationEventName, eventListener);
  };
};

export const normalizeAuthRoute = (pathname: string): AuthRoutePath => {
  if (pathname === authRoutes.selectTenant) {
    return authRoutes.selectTenant;
  }

  return authRoutes.login;
};
