import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Form, Select, Typography } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import type { ReactElement } from 'react';
import { z } from 'zod';

import { authRoutes, navigateTo } from '@/app/router/app-router';
import type { AuthLanguage } from '@/features/auth/model/auth.types';
import { AuthPageShell } from '@/features/auth/ui/AuthPageShell';
import { ProjectLogo } from '@/features/auth/ui/ProjectLogo';
import {
  authCompanyName,
  getTenantCodeOptions,
} from '@/features/tenant/api/tenant.catalog';
import { useResolveTenantMutation } from '@/features/tenant/hooks/useResolveTenantMutation';
import { useTenantStore } from '@/features/tenant/store/useTenantStore';
import { getCurrentHost } from '@/shared/lib/runtime-location';

const tenantSelectSchema = z.object({
  tenantCode: z.string().trim().min(2, 'Vui lòng nhập mã công ty hợp lệ.'),
});

type TenantSelectFormValues = z.infer<typeof tenantSelectSchema>;

interface SelectTenantPageProps {
  bootstrapError?: string | null;
  language: AuthLanguage;
  onLanguageChange: (language: AuthLanguage) => void;
}

const copyByLanguage = {
  en_US: {
    button: 'Continue',
    companyLabel: 'Company',
    helper: 'Choose a tenant code under the Fitly company to continue to the ERP login screen.',
    inputLabel: 'Tenant code',
    languageLabel: 'Language',
    title: 'Choose your company',
  },
  vi_VN: {
    button: 'Tiếp tục',
    companyLabel: 'Công ty',
    helper: 'Chọn tenant code thuộc công ty Fitly để tiếp tục vào màn hình đăng nhập ERP.',
    inputLabel: 'Tenant code',
    languageLabel: 'Ngôn ngữ',
    title: 'Chọn công ty của bạn',
  },
} as const;

export const SelectTenantPage = ({
  bootstrapError,
  language,
  onLanguageChange,
}: SelectTenantPageProps): ReactElement => {
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  const setSelectedTenant = useTenantStore((state) => state.setSelectedTenant);
  const resolveTenantMutation = useResolveTenantMutation();
  const copy = copyByLanguage[language];
  const tenantCodeOptions = getTenantCodeOptions();
  const form = useForm<TenantSelectFormValues>({
    defaultValues: {
      tenantCode: selectedTenant?.tenantCode ?? tenantCodeOptions[0]?.value ?? '',
    },
    mode: 'onBlur',
    resolver: zodResolver(tenantSelectSchema),
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const tenant = await resolveTenantMutation.mutateAsync({
      host: getCurrentHost(),
      tenantCode: values.tenantCode,
    });

    setSelectedTenant(tenant);
    navigateTo(authRoutes.login);
  });

  return (
    <AuthPageShell
      language={language}
      languageLabel={copy.languageLabel}
      onLanguageChange={onLanguageChange}
    >
      <ProjectLogo />

      <div className="space-y-2 text-center">
        <Typography.Title className="!mb-0 !text-3xl !font-semibold !tracking-tight !text-slate-900">
          {copy.title}
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 !text-sm !leading-6 !text-slate-500">
          {copy.helper}
        </Typography.Paragraph>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {copy.companyLabel}
        </p>
        <p className="mt-2 mb-0 text-base font-semibold text-slate-900">
          {authCompanyName}
        </p>
      </div>

      {bootstrapError ? <Alert showIcon title={bootstrapError} type="error" /> : null}

      {resolveTenantMutation.isError ? (
        <Alert
          showIcon
          title={resolveTenantMutation.error.message}
          type="error"
        />
      ) : null}

      <Form layout="vertical" component={false}>
        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          <Controller
            control={form.control}
            name="tenantCode"
            render={({ field, fieldState }) => (
              <Form.Item
                htmlFor="tenant-code"
                help={fieldState.error?.message}
                label={copy.inputLabel}
                required
                validateStatus={fieldState.error ? 'error' : undefined}
              >
                <Select
                  id="tenant-code"
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={tenantCodeOptions}
                  size="large"
                  value={field.value}
                />
              </Form.Item>
            )}
          />

          <Button
            block
            className="!mt-6 !h-11 !rounded-xl !border-0 !bg-teal-700 !font-medium hover:!bg-teal-800"
            htmlType="submit"
            loading={resolveTenantMutation.isPending}
            size="large"
            type="primary"
          >
            {copy.button}
          </Button>
        </form>
      </Form>
    </AuthPageShell>
  );
};
