import type { TenantContext, ResolveTenantInput } from '@/features/tenant/model/tenant.types';

import {
  findTenantByCode,
  findTenantByHost,
  toTenantContext,
} from '@/features/tenant/api/tenant.catalog';

const wait = async (durationMs: number): Promise<void> => {
  await new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
};

const postJson = async <TResponse>(
  url: string,
  body: unknown,
): Promise<TResponse | null> => {
  try {
    const response = await window.fetch(url, {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | TResponse
      | null;
    const errorMessage =
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : 'Không tìm thấy công ty/tenant';

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
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

const sharedHosts = new Set(['127.0.0.1', 'app.fitly.vn', 'localhost']);

const createTenantNotFoundError = (): Error & { code: string } => {
  const error = new Error('Không tìm thấy công ty/tenant') as Error & {
    code: string;
  };

  error.code = 'TENANT_NOT_FOUND';

  return error;
};

export const isSharedHost = (host: string): boolean => {
  const normalizedHost = host.trim().toLowerCase().split(':')[0] ?? '';

  return sharedHosts.has(normalizedHost);
};

export const resolveTenant = async (
  input: ResolveTenantInput,
): Promise<TenantContext> => {
  await wait(350);

  const apiResponse = await postJson<TenantContext>(
    '/api/public/tenants/resolve',
    input,
  );

  if (apiResponse) {
    return apiResponse;
  }

  if (input.tenantCode?.trim()) {
    const tenant = findTenantByCode(input.tenantCode);

    if (!tenant) {
      throw createTenantNotFoundError();
    }

    return toTenantContext(tenant, 'USER_INPUT');
  }

  if (input.host?.trim()) {
    const tenant = findTenantByHost(input.host);

    if (!tenant) {
      throw createTenantNotFoundError();
    }

    return toTenantContext(tenant, 'DOMAIN');
  }

  throw createTenantNotFoundError();
};
