import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { z } from 'zod';

import {
  authRoutes,
  navigateTo,
  replaceRoute,
  subscribeToNavigation,
} from '@/app/router/app-router';
import { useLoginMutation } from '@/features/auth/hooks/useLoginMutation';
import { usePasswordResetTokenQuery } from '@/features/auth/hooks/usePasswordResetTokenQuery';
import { useRequestPasswordResetMutation } from '@/features/auth/hooks/useRequestPasswordResetMutation';
import { useResetPasswordMutation } from '@/features/auth/hooks/useResetPasswordMutation';
import type { AuthLanguage, PasswordResetDispatch } from '@/features/auth/model/auth.types';
import { AuthPageShell } from '@/features/auth/ui/AuthPageShell';
import { ProjectLogo } from '@/features/auth/ui/ProjectLogo';
import { authCompanyName } from '@/features/tenant/api/tenant.catalog';
import type { TenantContext } from '@/features/tenant/model/tenant.types';
import { getCurrentSearch } from '@/shared/lib/runtime-location';

const identifierSchema = z
  .string()
  .trim()
  .min(2, 'Vui lòng nhập tài khoản hợp lệ.');

const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
});

const forgotPasswordSchema = z.object({
  identifier: identifierSchema,
});

const resetPasswordSchema = z
  .object({
    confirmPassword: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
type AuthView = 'forgot-password' | 'login' | 'reset-password';

interface LoginPageProps {
  canChangeTenant: boolean;
  language: AuthLanguage;
  onChangeLanguage: (language: AuthLanguage) => void;
  onChangeTenant: () => void;
  selectedTenant: TenantContext;
}

const copyByLanguage = {
  en_US: {
    backToLogin: 'Back to login',
    changeCompany: 'Change company',
    companyCodeLabel: 'Company code',
    companyLabel: 'Company',
    confirmPasswordLabel: 'Confirm password',
    forgotPasswordAction: 'Forgot password?',
    forgotPasswordHelp:
      'Enter your account or email for the selected company and we will generate a reset link.',
    forgotPasswordTitle: 'Reset your password',
    identifierLabel: 'Username / Email',
    identifierPlaceholder: 'Enter your username',
    languageLabel: 'Language',
    loadingResetLink: 'Loading reset link...',
    loginButton: 'Login',
    loginTitle: 'Sign in to',
    openResetLink: 'Open reset link',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    passwordResetEmailHint:
      'For this local demo, the generated email link is shown below.',
    passwordResetEmailSent: 'Password reset email sent for',
    passwordResetSuccess:
      'Password updated. Sign in with your new password.',
    resetLinkLabel: 'Reset link',
    resetPasswordButton: 'Update password',
    resetPasswordForLabel: 'Resetting password for',
    resetPasswordHelp: 'Create a new password for this account.',
    resetPasswordTitle: 'Reset password',
    sendAnotherLink: 'Send another link',
    sendResetLink: 'Send reset link',
  },
  vi_VN: {
    backToLogin: 'Quay lại đăng nhập',
    changeCompany: 'Đổi công ty',
    companyCodeLabel: 'Mã công ty',
    companyLabel: 'Công ty',
    confirmPasswordLabel: 'Nhập lại mật khẩu',
    forgotPasswordAction: 'Quên mật khẩu?',
    forgotPasswordHelp:
      'Nhập tài khoản hoặc email thuộc công ty đã chọn để nhận liên kết đặt lại mật khẩu.',
    forgotPasswordTitle: 'Khôi phục mật khẩu',
    identifierLabel: 'Tài khoản / Email',
    identifierPlaceholder: 'Nhập tài khoản của bạn',
    languageLabel: 'Ngôn ngữ',
    loadingResetLink: 'Đang tải liên kết đặt lại mật khẩu...',
    loginButton: 'Đăng nhập',
    loginTitle: 'Đăng nhập vào',
    openResetLink: 'Mở liên kết đặt lại mật khẩu',
    passwordLabel: 'Mật khẩu',
    passwordPlaceholder: 'Nhập mật khẩu',
    passwordResetEmailHint:
      'Trong bản demo local này, liên kết từ email được hiển thị ngay bên dưới.',
    passwordResetEmailSent: 'Đã tạo email đặt lại mật khẩu cho',
    passwordResetSuccess:
      'Mật khẩu đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới.',
    resetLinkLabel: 'Liên kết đặt lại mật khẩu',
    resetPasswordButton: 'Cập nhật mật khẩu',
    resetPasswordForLabel: 'Đang đặt lại mật khẩu cho',
    resetPasswordHelp: 'Tạo mật khẩu mới cho tài khoản này.',
    resetPasswordTitle: 'Đặt lại mật khẩu',
    sendAnotherLink: 'Gửi liên kết khác',
    sendResetLink: 'Gửi liên kết đặt lại mật khẩu',
  },
} as const;

const getResetTokenFromLocation = (): string | null => {
  const query = new URLSearchParams(getCurrentSearch());

  return query.get('resetToken');
};

const getInitialAuthView = (): AuthView =>
  getResetTokenFromLocation() ? 'reset-password' : 'login';

export const LoginPage = ({
  canChangeTenant,
  language,
  onChangeLanguage,
  onChangeTenant,
  selectedTenant,
}: LoginPageProps): ReactElement => {
  const initialResetToken = useMemo(() => getResetTokenFromLocation(), []);
  const [view, setView] = useState<AuthView>(getInitialAuthView);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [resetDispatch, setResetDispatch] = useState<PasswordResetDispatch | null>(
    null,
  );
  const [activeResetToken, setActiveResetToken] = useState<string | null>(
    initialResetToken,
  );
  const copy = copyByLanguage[language];
  const loginMutation = useLoginMutation();
  const requestPasswordResetMutation = useRequestPasswordResetMutation();
  const resetPasswordMutation = useResetPasswordMutation();
  const passwordResetTokenQuery = usePasswordResetTokenQuery(
    view === 'reset-password' ? activeResetToken : null,
  );

  const loginForm = useForm<LoginFormValues>({
    defaultValues: {
      identifier: '',
      password: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(loginSchema),
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      identifier: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(forgotPasswordSchema),
  });

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    defaultValues: {
      confirmPassword: '',
      password: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    return subscribeToNavigation(() => {
      const resetToken = getResetTokenFromLocation();

      setActiveResetToken(resetToken);
      setView(resetToken ? 'reset-password' : 'login');
    });
  }, []);

  const navigateToLogin = (notice?: string) => {
    replaceRoute(authRoutes.login);
    setActiveResetToken(null);
    setView('login');
    setResetDispatch(null);
    setLoginNotice(notice ?? null);
    loginMutation.reset();
    requestPasswordResetMutation.reset();
    resetPasswordMutation.reset();
  };

  const navigateToForgotPassword = () => {
    forgotPasswordForm.reset({
      identifier: loginForm.getValues('identifier').trim(),
    });
    setView('forgot-password');
    setResetDispatch(null);
    setLoginNotice(null);
    loginMutation.reset();
    requestPasswordResetMutation.reset();
    resetPasswordMutation.reset();
  };

  const navigateToResetPassword = (dispatch: PasswordResetDispatch) => {
    const resetUrl = new URL(dispatch.resetLink);
    const token = resetUrl.searchParams.get('resetToken');

    if (!token) {
      return;
    }

    navigateTo(authRoutes.login, `${resetUrl.search}`);
    resetPasswordForm.reset({
      confirmPassword: '',
      password: '',
    });
    setActiveResetToken(token);
    setView('reset-password');
    setLoginNotice(null);
    resetPasswordMutation.reset();
  };

  const handleLoginSubmit = loginForm.handleSubmit(async (values) => {
    setLoginNotice(null);

    await loginMutation.mutateAsync({
      password: values.password,
      tenantId: selectedTenant.tenantId,
      username: values.identifier,
    });
  });

  const handleForgotPasswordSubmit = forgotPasswordForm.handleSubmit(
    async (values) => {
      const dispatch = await requestPasswordResetMutation.mutateAsync({
        identifier: values.identifier,
        tenantId: selectedTenant.tenantId,
      });

      setResetDispatch(dispatch);
    },
  );

  const handleResetPasswordSubmit = resetPasswordForm.handleSubmit(
    async (values) => {
      if (!activeResetToken) {
        return;
      }

      const result = await resetPasswordMutation.mutateAsync({
        password: values.password,
        token: activeResetToken,
      });

      loginForm.reset({
        identifier: result.identifier,
        password: '',
      });
      forgotPasswordForm.reset({
        identifier: result.identifier,
      });
      resetPasswordForm.reset({
        confirmPassword: '',
        password: '',
      });
      navigateToLogin(copy.passwordResetSuccess);
    },
  );

  return (
    <AuthPageShell
      language={language}
      languageLabel={copy.languageLabel}
      onLanguageChange={onChangeLanguage}
    >
      <ProjectLogo />

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {copy.companyLabel}
        </p>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="m-0 text-base font-semibold text-slate-900">
              {authCompanyName}
            </p>
            <p className="mt-1 mb-0 text-sm text-slate-500">
              {copy.companyCodeLabel}: {selectedTenant.tenantCode}
            </p>
          </div>

          {canChangeTenant ? (
            <button
              className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-teal-700 hover:text-teal-800"
              onClick={onChangeTenant}
              type="button"
            >
              {copy.changeCompany}
            </button>
          ) : null}
        </div>
      </div>

      {loginNotice ? <Alert showIcon title={loginNotice} type="success" /> : null}

      {view === 'login' ? (
        <div className="space-y-6">
          <div className="space-y-1 text-center">
            <Typography.Title className="!mb-0 !text-3xl !font-semibold !tracking-tight !text-slate-900">
              {`${copy.loginTitle} ${authCompanyName}`}
            </Typography.Title>
          </div>

          {loginMutation.isError ? (
            <Alert showIcon title={loginMutation.error.message} type="error" />
          ) : null}

          <Form layout="vertical" component={false}>
            <form className="space-y-4" noValidate onSubmit={handleLoginSubmit}>
              <Controller
                control={loginForm.control}
                name="identifier"
                render={({ field, fieldState }) => (
                  <Form.Item
                    htmlFor="identifier"
                    help={fieldState.error?.message}
                    label={copy.identifierLabel}
                    required
                    validateStatus={fieldState.error ? 'error' : undefined}
                  >
                    <Input
                      {...field}
                      aria-invalid={Boolean(fieldState.error)}
                      autoComplete="username"
                      id="identifier"
                      placeholder={copy.identifierPlaceholder}
                      size="large"
                    />
                  </Form.Item>
                )}
              />

              <Controller
                control={loginForm.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Form.Item
                    extra={
                      <button
                        className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-teal-700 hover:text-teal-800"
                        onClick={navigateToForgotPassword}
                        type="button"
                      >
                        {copy.forgotPasswordAction}
                      </button>
                    }
                    htmlFor="password"
                    help={fieldState.error?.message}
                    label={copy.passwordLabel}
                    required
                    validateStatus={fieldState.error ? 'error' : undefined}
                  >
                    <Input.Password
                      {...field}
                      aria-invalid={Boolean(fieldState.error)}
                      autoComplete="current-password"
                      id="password"
                      placeholder={copy.passwordPlaceholder}
                      size="large"
                    />
                  </Form.Item>
                )}
              />

              <Button
                block
                className="!mt-6 !h-11 !rounded-xl !border-0 !bg-teal-700 !font-medium hover:!bg-teal-800"
                htmlType="submit"
                loading={loginMutation.isPending}
                size="large"
                type="primary"
              >
                {copy.loginButton}
              </Button>
            </form>
          </Form>
        </div>
      ) : null}

      {view === 'forgot-password' ? (
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <Typography.Title className="!mb-0 !text-3xl !font-semibold !tracking-tight !text-slate-900">
              {copy.forgotPasswordTitle}
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-sm !leading-6 !text-slate-500">
              {copy.forgotPasswordHelp}
            </Typography.Paragraph>
          </div>

          {requestPasswordResetMutation.isError ? (
            <Alert
              showIcon
              title={requestPasswordResetMutation.error.message}
              type="error"
            />
          ) : null}

          {resetDispatch ? (
            <div className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/80 p-4">
              <Alert
                description={copy.passwordResetEmailHint}
                showIcon
                title={`${copy.passwordResetEmailSent} ${resetDispatch.identifier}`}
                type="success"
              />

              <Form.Item className="!mb-0" htmlFor="reset-link" label={copy.resetLinkLabel}>
                <Input id="reset-link" readOnly value={resetDispatch.resetLink} />
              </Form.Item>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  className="!h-11 !rounded-xl !border-0 !bg-teal-700 !font-medium hover:!bg-teal-800"
                  onClick={() => navigateToResetPassword(resetDispatch)}
                  type="primary"
                >
                  {copy.openResetLink}
                </Button>
                <Button
                  className="!h-11 !rounded-xl"
                  onClick={() => {
                    requestPasswordResetMutation.reset();
                    setResetDispatch(null);
                  }}
                >
                  {copy.sendAnotherLink}
                </Button>
              </div>
            </div>
          ) : (
            <Form layout="vertical" component={false}>
              <form
                className="space-y-4"
                noValidate
                onSubmit={handleForgotPasswordSubmit}
              >
                <Controller
                  control={forgotPasswordForm.control}
                  name="identifier"
                  render={({ field, fieldState }) => (
                    <Form.Item
                      htmlFor="forgot-identifier"
                      help={fieldState.error?.message}
                      label={copy.identifierLabel}
                      required
                      validateStatus={fieldState.error ? 'error' : undefined}
                    >
                      <Input
                        {...field}
                        aria-invalid={Boolean(fieldState.error)}
                        autoComplete="email"
                        id="forgot-identifier"
                        placeholder={copy.identifierPlaceholder}
                        size="large"
                      />
                    </Form.Item>
                  )}
                />

                <Button
                  block
                  className="!mt-6 !h-11 !rounded-xl !border-0 !bg-teal-700 !font-medium hover:!bg-teal-800"
                  htmlType="submit"
                  loading={requestPasswordResetMutation.isPending}
                  size="large"
                  type="primary"
                >
                  {copy.sendResetLink}
                </Button>
              </form>
            </Form>
          )}

          <Button block className="!h-11 !rounded-xl" onClick={() => navigateToLogin()}>
            {copy.backToLogin}
          </Button>
        </div>
      ) : null}

      {view === 'reset-password' ? (
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <Typography.Title className="!mb-0 !text-3xl !font-semibold !tracking-tight !text-slate-900">
              {copy.resetPasswordTitle}
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-sm !leading-6 !text-slate-500">
              {copy.resetPasswordHelp}
            </Typography.Paragraph>
          </div>

          {passwordResetTokenQuery.isPending ? (
            <Alert showIcon title={copy.loadingResetLink} type="info" />
          ) : null}

          {passwordResetTokenQuery.isError ? (
            <Alert
              showIcon
              title={passwordResetTokenQuery.error.message}
              type="error"
            />
          ) : null}

          {resetPasswordMutation.isError ? (
            <Alert showIcon title={resetPasswordMutation.error.message} type="error" />
          ) : null}

          {passwordResetTokenQuery.data ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {copy.resetPasswordForLabel}
              </p>
              <p className="mt-2 mb-0 text-sm font-medium text-slate-800">
                {passwordResetTokenQuery.data.identifier}
              </p>
            </div>
          ) : null}

          <Form layout="vertical" component={false}>
            <form className="space-y-4" noValidate onSubmit={handleResetPasswordSubmit}>
              <Controller
                control={resetPasswordForm.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Form.Item
                    htmlFor="new-password"
                    help={fieldState.error?.message}
                    label={copy.passwordLabel}
                    required
                    validateStatus={fieldState.error ? 'error' : undefined}
                  >
                    <Input.Password
                      {...field}
                      aria-invalid={Boolean(fieldState.error)}
                      autoComplete="new-password"
                      id="new-password"
                      placeholder="123456"
                      size="large"
                    />
                  </Form.Item>
                )}
              />

              <Controller
                control={resetPasswordForm.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <Form.Item
                    htmlFor="confirm-password"
                    help={fieldState.error?.message}
                    label={copy.confirmPasswordLabel}
                    required
                    validateStatus={fieldState.error ? 'error' : undefined}
                  >
                    <Input.Password
                      {...field}
                      aria-invalid={Boolean(fieldState.error)}
                      autoComplete="new-password"
                      id="confirm-password"
                      placeholder="123456"
                      size="large"
                    />
                  </Form.Item>
                )}
              />

              <Button
                block
                className="!mt-6 !h-11 !rounded-xl !border-0 !bg-teal-700 !font-medium hover:!bg-teal-800"
                disabled={!passwordResetTokenQuery.data}
                htmlType="submit"
                loading={resetPasswordMutation.isPending}
                size="large"
                type="primary"
              >
                {copy.resetPasswordButton}
              </Button>
            </form>
          </Form>

          <Button block className="!h-11 !rounded-xl" onClick={() => navigateToLogin()}>
            {copy.backToLogin}
          </Button>
        </div>
      ) : null}
    </AuthPageShell>
  );
};
