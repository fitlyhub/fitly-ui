import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  DashboardOutlined,
  DeleteOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  DownOutlined,
  DownloadOutlined,
  DragOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FilterOutlined,
  HistoryOutlined,
  HolderOutlined,
  HomeOutlined,
  LeftOutlined,
  LogoutOutlined,
  MailOutlined,
  MenuOutlined,
  MoreOutlined,
  PaperClipOutlined,
  PlusOutlined,
  PrinterOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  SearchOutlined,
  SendOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ToolOutlined,
  UpOutlined,
  UploadOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { ReactElement, ReactNode } from 'react';

import type {
  DynamicRecordActionIcon,
  DynamicRecordDefaultActionKey,
} from '@/engines/dynamic-page/model/dynamic-page.types';
import type {
  WorkspaceModuleKey,
  WorkspaceNavItem,
} from '@/features/workspace/model/workspace.types';

export {
  AppstoreOutlined,
  ArrowLeftOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  DashboardOutlined,
  DeleteOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  DownOutlined,
  DownloadOutlined,
  DragOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FilterOutlined,
  HistoryOutlined,
  HolderOutlined,
  HomeOutlined,
  LeftOutlined,
  LogoutOutlined,
  MailOutlined,
  MenuOutlined,
  MoreOutlined,
  PaperClipOutlined,
  PlusOutlined,
  PrinterOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  SearchOutlined,
  SendOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ToolOutlined,
  UpOutlined,
  UploadOutlined,
  WalletOutlined,
};

export const workspaceModuleIconConfig: Record<WorkspaceModuleKey, ReactNode> = {
  'access-control': <SafetyCertificateOutlined />,
  customers: <TeamOutlined />,
  dashboard: <DashboardOutlined />,
  employees: <TeamOutlined />,
  finance: <WalletOutlined />,
  'finance-invoices': <FileTextOutlined />,
  invoices: <FileTextOutlined />,
  organization: <TeamOutlined />,
  'price-list': <FileTextOutlined />,
  products: <FileTextOutlined />,
  'purchase-orders': <FileTextOutlined />,
  'purchase-requests': <FileTextOutlined />,
  'sales-invoices': <FileTextOutlined />,
  'sales-orders': <ShoppingCartOutlined />,
  'stock-transfers': <AppstoreOutlined />,
  vendors: <TeamOutlined />,
  warehouse: <AppstoreOutlined />,
};

export const navigationGroupIconConfig: Record<string, ReactNode> = {
  administration: <SafetyCertificateOutlined />,
  finance: <WalletOutlined />,
  purchase: <FileTextOutlined />,
  sales: <ShopOutlined />,
  warehouse: <AppstoreOutlined />,
};

export const getWorkspaceNavigationIcon = (
  item: WorkspaceNavItem,
): ReactNode => {
  if (item.moduleKey) {
    return workspaceModuleIconConfig[item.moduleKey];
  }

  return navigationGroupIconConfig[item.key] ?? <HistoryOutlined />;
};

export const dynamicRecordActionIconConfig: Record<
  DynamicRecordActionIcon,
  ReactElement
> = {
  approve: <CheckCircleOutlined />,
  attach: <PaperClipOutlined />,
  download: <DownloadOutlined />,
  export: <FileExcelOutlined />,
  import: <UploadOutlined />,
  mail: <MailOutlined />,
  new: <PlusOutlined />,
  print: <PrinterOutlined />,
  refresh: <ReloadOutlined />,
  send: <SendOutlined />,
  tool: <ToolOutlined />,
  upload: <UploadOutlined />,
};

export const dynamicRecordDefaultActionIconConfig: Record<
  DynamicRecordDefaultActionKey,
  ReactElement
> = {
  attachFile: <PaperClipOutlined />,
  create: <PlusOutlined />,
  exportExcel: <DownloadOutlined />,
  importExcel: <UploadOutlined />,
};

export const getDynamicRecordActionIcon = (
  icon: DynamicRecordActionIcon | undefined,
): ReactElement | undefined => {
  return icon ? dynamicRecordActionIconConfig[icon] : undefined;
};
