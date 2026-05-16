import type {
  LoginPayload,
  LoginResponse,
  PasswordResetDispatch,
  PasswordResetRequestInput,
  PasswordResetSession,
  ResetPasswordInput,
} from '@/features/auth/model/auth.types';
import { authRoutes } from '@/app/router/app-router';
import {
  findTenantById,
  findTenantUser,
} from '@/features/tenant/api/tenant.catalog';
import { getCurrentOrigin } from '@/shared/lib/runtime-location';

interface PasswordResetRecord extends PasswordResetSession {
  createdAt: number;
  usedAt: number | null;
}

const defaultPassword = '123456';
const passwordStorageKey = 'fitly-auth-passwords';
const passwordResetStorageKey = 'fitly-password-reset-requests';
const passwordResetTtlMs = 1000 * 60 * 30;

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
        : 'Đăng nhập thất bại.';

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

const normalizeIdentifier = (identifier: string): string =>
  identifier.trim().toLowerCase().split('@')[0] ?? '';

const getStoredPasswords = (): Record<string, string> => {
  const rawValue = window.localStorage.getItem(passwordStorageKey);

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as Record<string, string>;
  } catch {
    return {};
  }
};

const setStoredPasswords = (passwords: Record<string, string>): void => {
  window.localStorage.setItem(passwordStorageKey, JSON.stringify(passwords));
};

const getStoredPasswordResetRequests = (): Record<string, PasswordResetRecord> => {
  const rawValue = window.localStorage.getItem(passwordResetStorageKey);

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as Record<string, PasswordResetRecord>;
  } catch {
    return {};
  }
};

const setStoredPasswordResetRequests = (
  requests: Record<string, PasswordResetRecord>,
): void => {
  window.localStorage.setItem(passwordResetStorageKey, JSON.stringify(requests));
};

const buildPasswordStorageKey = (tenantId: string, username: string): string => {
  return `${tenantId}:${normalizeIdentifier(username)}`;
};

const buildResetLink = (token: string): string => {
  return `${getCurrentOrigin()}${authRoutes.login}?resetToken=${encodeURIComponent(token)}`;
};

const createResetToken = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }

  return `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
};

const resolveExpectedPassword = (tenantId: string, username: string): string => {
  const passwords = getStoredPasswords();
  const storageKey = buildPasswordStorageKey(tenantId, username);

  return passwords[storageKey] ?? defaultPassword;
};

const getValidPasswordResetRecord = (token: string): PasswordResetRecord => {
  const requests = getStoredPasswordResetRequests();
  const record = requests[token];

  if (!record) {
    throw new Error('This password reset link is invalid or has expired.');
  }

  if (record.usedAt) {
    throw new Error('This password reset link has already been used.');
  }

  if (Date.now() - record.createdAt > passwordResetTtlMs) {
    delete requests[token];
    setStoredPasswordResetRequests(requests);
    throw new Error('This password reset link is invalid or has expired.');
  }

  return record;
};

export const login = async (
  payload: LoginPayload,
): Promise<LoginResponse> => {
  await wait(350);

  const apiResponse = await postJson<LoginResponse>('/api/auth/login', payload);

  if (apiResponse) {
    return apiResponse;
  }

  const tenant = findTenantById(payload.tenantId);
  const username = normalizeIdentifier(payload.username);

  if (!tenant) {
    throw new Error('Không tìm thấy công ty/tenant');
  }

  const user = findTenantUser(payload.tenantId, username);

  if (!user) {
    throw new Error('Sai tài khoản hoặc mật khẩu.');
  }

  const expectedPassword = resolveExpectedPassword(payload.tenantId, username);

  if (payload.password !== expectedPassword) {
    throw new Error('Sai tài khoản hoặc mật khẩu.');
  }

  return {
    accessToken: `access_${tenant.tenantId}_${user.username}`,
    refreshToken: `refresh_${tenant.tenantId}_${user.username}`,
    tenant: {
      tenantCode: tenant.tenantCode,
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
    },
    user: {
      userId: user.userId,
      username: user.username,
    },
  };
};

export const requestPasswordReset = async (
  input: PasswordResetRequestInput,
): Promise<PasswordResetDispatch> => {
  await wait(350);

  const tenant = findTenantById(input.tenantId);
  const normalizedIdentifier = normalizeIdentifier(input.identifier);

  if (!tenant) {
    throw new Error('Không tìm thấy công ty/tenant');
  }

  if (!findTenantUser(input.tenantId, normalizedIdentifier)) {
    throw new Error('Không tìm thấy tài khoản cho công ty đã chọn.');
  }

  const token = createResetToken();
  const requests = getStoredPasswordResetRequests();

  requests[token] = {
    createdAt: Date.now(),
    identifier: normalizedIdentifier,
    tenantId: tenant.tenantId,
    tenantName: tenant.tenantName,
    token,
    usedAt: null,
  };

  setStoredPasswordResetRequests(requests);

  return {
    identifier: normalizedIdentifier,
    resetLink: buildResetLink(token),
    tenantId: tenant.tenantId,
    tenantName: tenant.tenantName,
    token,
  };
};

export const verifyPasswordResetToken = async (
  token: string,
): Promise<PasswordResetSession> => {
  await wait(200);

  const record = getValidPasswordResetRecord(token);

  return {
    identifier: record.identifier,
    tenantId: record.tenantId,
    tenantName: record.tenantName,
    token: record.token,
  };
};

export const resetPassword = async (
  input: ResetPasswordInput,
): Promise<PasswordResetSession> => {
  await wait(350);

  const record = getValidPasswordResetRecord(input.token);
  const passwords = getStoredPasswords();
  const requests = getStoredPasswordResetRequests();
  const storageKey = buildPasswordStorageKey(record.tenantId, record.identifier);

  passwords[storageKey] = input.password;
  setStoredPasswords(passwords);

  requests[record.token] = {
    ...record,
    usedAt: Date.now(),
  };
  setStoredPasswordResetRequests(requests);

  return {
    identifier: record.identifier,
    tenantId: record.tenantId,
    tenantName: record.tenantName,
    token: record.token,
  };
};
