import { Avatar, Badge, Button, Popover, Select, Tooltip } from 'antd';
import type { ReactElement } from 'react';

import {
  BellOutlined,
  brandConfig,
  logoClassConfig,
  logoImageConfig,
  LogoutOutlined,
  MailOutlined,
  MenuOutlined,
  QuestionCircleOutlined,
} from '@/app/config/visual';
import type { AuthLanguage, UserSession } from '@/features/auth/model/auth.types';
import type { WorkspaceModuleSchema } from '@/features/workspace/model/workspace.types';

interface WorkspaceHeaderProps {
  isSidebarCollapsed: boolean;
  language: AuthLanguage;
  module: WorkspaceModuleSchema | undefined;
  session: UserSession;
  onChangeLanguage: (language: AuthLanguage) => void;
  onSignOut: () => void;
  onToggleSidebar: () => void;
}

const languageOptions: Array<{ label: string; value: AuthLanguage }> = [
  { label: 'Tieng Viet', value: 'vi_VN' },
  { label: 'English', value: 'en_US' },
];

const getInitials = (name: string): string => {
  return (
    name
      .split(' ')
      .slice(0, 2)
      .map((token) => token.charAt(0).toUpperCase())
      .join('') || 'F'
  );
};

export const WorkspaceHeader = ({
  isSidebarCollapsed,
  language,
  module,
  session,
  onChangeLanguage,
  onSignOut,
  onToggleSidebar,
}: WorkspaceHeaderProps): ReactElement => {
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-5 lg:px-7">
      {module ? <h1 className="sr-only">{module.title}</h1> : null}

      <div className="flex min-h-12 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {isSidebarCollapsed ? (
            <Button
              aria-expanded={false}
              aria-label="Show workspace menu"
              className="!h-10 !w-10 !rounded-lg !border-slate-200 !bg-white !text-teal-800 shadow-sm hover:!border-teal-300 hover:!text-teal-700"
              icon={<MenuOutlined />}
              onClick={onToggleSidebar}
            />
          ) : null}
          <div className="flex min-w-0 items-center gap-2.5">
            <div className={logoClassConfig.workspace.headerMark}>
              <img
                alt={logoImageConfig.icon.alt}
                className={logoClassConfig.workspace.markImage}
                src={logoImageConfig.icon.src}
              />
            </div>
            <div className="min-w-0">
              <p className={`${logoClassConfig.workspace.title} text-slate-950`}>
                {brandConfig.productName}
              </p>
              <p className={`${logoClassConfig.workspace.subtitle} hidden text-slate-500 sm:block`}>
                {brandConfig.workspaceName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <Tooltip title="Email support">
            <Button
              aria-label="Email support"
              className="!h-10 !w-10 !rounded-lg !border-slate-200 !text-slate-600 hover:!border-teal-300 hover:!text-teal-700"
              href={`mailto:${brandConfig.supportEmail}`}
              icon={<MailOutlined />}
            />
          </Tooltip>

          <Tooltip title="Notifications">
            <Badge dot offset={[-6, 6]}>
              <Button
                aria-label="Notifications"
                className="!h-10 !w-10 !rounded-lg !border-slate-200 !text-slate-600 hover:!border-teal-300 hover:!text-teal-700"
                icon={<BellOutlined />}
              />
            </Badge>
          </Tooltip>

          <Popover
            arrow={false}
            content={
              <div className="w-60">
                <p className="m-0 text-sm font-semibold text-slate-950">
                  Fitly support
                </p>
                <p className="mt-1 mb-3 text-sm leading-5 text-slate-500">
                  Contact support for account, workflow, or configuration help.
                </p>
                <Button
                  block
                  href={`mailto:${brandConfig.supportEmail}`}
                  icon={<MailOutlined />}
                  type="primary"
                >
                  {brandConfig.supportEmail}
                </Button>
              </div>
            }
            placement="bottomRight"
            trigger="click"
          >
            <Button
              aria-label="Help"
              className="!h-10 !w-10 !rounded-lg !border-slate-200 !text-slate-600 hover:!border-teal-300 hover:!text-teal-700"
              icon={<QuestionCircleOutlined />}
            />
          </Popover>

          <Popover
            arrow={false}
            content={
              <div className="w-56">
                <label className="block text-xs font-semibold uppercase text-slate-500">
                  Language
                </label>
                <Select<AuthLanguage>
                  aria-label="Workspace language"
                  className="mt-2 w-full"
                  options={languageOptions}
                  value={language}
                  onChange={onChangeLanguage}
                />
                <Button
                  block
                  className="mt-3 !justify-start"
                  icon={<LogoutOutlined />}
                  type="text"
                  onClick={onSignOut}
                >
                  Log out
                </Button>
              </div>
            }
            placement="bottomRight"
            trigger="click"
          >
            <Button
              aria-label="User menu"
              className="!h-11 !max-w-[220px] !rounded-lg !border-slate-200 !px-2.5 !text-left hover:!border-teal-300"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Avatar className="shrink-0 !bg-teal-700 !text-white" size={28}>
                  {getInitials(session.name)}
                </Avatar>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-sm font-semibold leading-5 text-slate-950">
                    {session.name}
                  </span>
                  <span className="block truncate text-[11px] font-medium uppercase leading-4 text-slate-500">
                    {session.role}
                  </span>
                </span>
              </span>
            </Button>
          </Popover>
        </div>
      </div>
    </header>
  );
};
