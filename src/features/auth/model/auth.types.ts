export interface LoginPayload {
  password: string;
  tenantId: string;
  username: string;
}

export type AuthLanguage = 'en_US' | 'vi_VN';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tenant: {
    tenantCode: string;
    tenantId: string;
    tenantName: string;
  };
  user: {
    userId: string;
    username: string;
  };
}

export interface UserSession {
  accessToken: string;
  id: string;
  refreshToken: string;
  tenantCode: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  username: string;
  name: string;
  role: string;
  workspace: string;
  email: string;
}

export interface PasswordResetRequestInput {
  identifier: string;
  tenantId: string;
}

export interface PasswordResetDispatch {
  identifier: string;
  resetLink: string;
  tenantId: string;
  tenantName: string;
  token: string;
}

export interface PasswordResetSession {
  identifier: string;
  tenantId: string;
  tenantName: string;
  token: string;
}

export interface ResetPasswordInput {
  password: string;
  token: string;
}
