import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App';
import { resetAuthStore, useAuthStore } from '@/features/auth/store/useAuthStore';
import { resetTenantStore } from '@/features/tenant/store/useTenantStore';
import { resetWorkspaceStore, useWorkspaceStore } from '@/features/workspace/store/useWorkspaceStore';
import * as runtimeLocation from '@/shared/lib/runtime-location';
import { renderWithProviders } from '@/test/test-utils';

const selectTenant = async (tenantCode = 'fitly-demo') => {
  const user = userEvent.setup();

  await screen.findByRole('heading', { name: 'Chọn công ty của bạn' });
  if (tenantCode !== 'fitly-demo') {
    await user.click(screen.getByRole('combobox', { name: 'Tenant code' }));
    await user.click(await screen.findByText(tenantCode));
  }
  await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
  await screen.findByRole('heading', { name: /Đăng nhập vào/ });

  return user;
};

const loginThroughTenantFlow = async (
  username = 'admin',
  password = '123456',
) => {
  const user = await selectTenant();

  expect(
    await screen.findByRole('heading', { name: 'Đăng nhập vào Fitly' }),
  ).toBeInTheDocument();
  await user.type(screen.getByLabelText('Tài khoản / Email'), username);
  await user.type(screen.getByLabelText('Mật khẩu'), password);
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  await screen.findByText('Operations command center');

  return user;
};

describe('App shell flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(runtimeLocation, 'getCurrentHost').mockReturnValue('localhost');
    window.history.replaceState({}, '', '/');
    localStorage.clear();
    resetAuthStore();
    resetTenantStore();
    resetWorkspaceStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the tenant selection page on a shared domain', async () => {
    renderWithProviders(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Chọn công ty của bạn' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeInTheDocument();
    expect(screen.getByText('Ngôn ngữ')).toBeInTheDocument();
  });

  it('redirects /login to tenant selection when no tenant context exists on a shared domain', async () => {
    window.history.replaceState({}, '', '/login');

    renderWithProviders(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Chọn công ty của bạn' }),
    ).toBeInTheDocument();
  });

  it('resolves a tenant from user input and routes to login', async () => {
    renderWithProviders(<App />);

    await selectTenant('fitly-demo');

    expect(
      await screen.findByRole('heading', { name: 'Đăng nhập vào Fitly' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Công ty')).toBeInTheDocument();
    expect(screen.getAllByText('Fitly').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: 'Đổi công ty' }),
    ).toBeInTheDocument();
  });

  it('auto-resolves the tenant from a tenant domain and jumps straight to login', async () => {
    vi.spyOn(runtimeLocation, 'getCurrentHost').mockReturnValue('tenant-a.fitly.vn');

    renderWithProviders(<App />);

    expect(
      await screen.findByRole('heading', {
        name: 'Đăng nhập vào Fitly',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Chọn công ty của bạn' }),
    ).not.toBeInTheDocument();
  });

  it('sends a reset link and lets the user set a new password inside the selected tenant', async () => {
    renderWithProviders(<App />);

    const user = await selectTenant('fitly-demo');

    await user.click(screen.getByRole('button', { name: 'Quên mật khẩu?' }));
    expect(
      await screen.findByRole('heading', { name: 'Khôi phục mật khẩu' }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Tài khoản / Email'), 'admin');
    await user.click(
      screen.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu' }),
    );

    expect(
      await screen.findByText(/Đã tạo email đặt lại mật khẩu cho/),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(/resetToken=/)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Mở liên kết đặt lại mật khẩu' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Đặt lại mật khẩu' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('admin')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Mật khẩu'), '654321');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu'), '654321');
    await user.click(screen.getByRole('button', { name: 'Cập nhật mật khẩu' }));

    expect(
      await screen.findByText(
        'Mật khẩu đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Đăng nhập vào Fitly' }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Mật khẩu'), '654321');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(
      await screen.findByText('Operations command center'),
    ).toBeInTheDocument();
  });

  it('logs in and navigates between workspace modules', async () => {
    renderWithProviders(<App />);

    const user = await loginThroughTenantFlow();

    expect(
      await screen.findByText('Operations command center'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Escalated workflows')).toBeInTheDocument();

    await user.click(screen.getByText('Employees'));

    expect(await screen.findByText('Employee master data')).toBeInTheDocument();
    expect(await screen.findByText('User onboarding form')).toBeInTheDocument();
  });

  it('opens menu modules in multiple workspace tabs', async () => {
    renderWithProviders(<App />);

    const user = await loginThroughTenantFlow();

    expect(
      await screen.findByText('Operations command center'),
    ).toBeInTheDocument();

    await user.click(screen.getByText('Sales Order'));

    expect(await screen.findByText('SO-00034')).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Sales Order' }),
    ).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByText('Sales Invoice'));

    expect(
      await screen.findByText('Sales invoice workspace'),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sales Order' })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Sales Invoice' }),
    ).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'Sales Order' }));

    expect(await screen.findByText('SO-00034')).toBeInTheDocument();
  });

  it('keeps table filters hidden until the filter action is clicked', async () => {
    renderWithProviders(<App />);

    const user = await loginThroughTenantFlow();

    await user.click(screen.getByText('Sales Order'));

    expect(await screen.findByText('SO-00034')).toBeInTheDocument();
    expect(screen.queryByText('Tim kiem & Loc')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Open Sales Order filters' }),
    );

    expect(await screen.findByText('Tim kiem & Loc')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Sales Order search'), 'ABC');
    await user.click(screen.getAllByRole('button', { name: 'Ap dung' })[0]);

    expect(await screen.findByText('Cong ty TNHH ABC')).toBeInTheDocument();
    expect(screen.queryByText('Cong ty CP XYZ')).not.toBeInTheDocument();
  });

  it('collapses and expands the workspace menu', async () => {
    renderWithProviders(<App />);

    const user = await loginThroughTenantFlow();

    expect(
      await screen.findByText('Operations command center'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Fitly Platform')).toBeInTheDocument();

    await user.click(
      screen.getAllByRole('button', { name: 'Hide workspace menu' })[0],
    );

    expect(screen.queryByText('Fitly Platform')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Show workspace menu' }),
    );

    expect(await screen.findByText('Fitly Platform')).toBeInTheDocument();
  });

  it('restores a pre-authenticated shell state from the stores', async () => {
    useAuthStore.getState().signIn({
      accessToken: 'access_tenant_001_buyer',
      email: 'buyer',
      id: '100002',
      name: 'Buyer',
      refreshToken: 'refresh_tenant_001_buyer',
      role: 'Procurement Lead',
      tenantCode: 'fitly-demo',
      tenantId: 'tenant_001',
      tenantName: 'Fitly Demo',
      userId: '100002',
      username: 'buyer',
      workspace: 'Fitly Demo',
    });
    useWorkspaceStore.getState().setActiveModule('purchase-orders');

    renderWithProviders(<App />);

    expect(
      await screen.findByText('Purchase order approvals'),
    ).toBeInTheDocument();
  });
});
