import type {
  DynamicFormFieldSchema,
  DynamicFormValues,
} from '@/engines/dynamic-form';

export type DynamicTableCellValue = string | number | boolean | null;

export type DynamicStatusTone =
  | 'default'
  | 'processing'
  | 'success'
  | 'warning'
  | 'error';

export interface DynamicHeroSection {
  id: string;
  type: 'hero';
  eyebrow: string;
  title: string;
  description: string;
}

export interface DynamicStatItem {
  label: string;
  value: string | number;
  helper?: string;
  tone?: 'neutral' | 'positive' | 'warning';
}

export interface DynamicStatsSection {
  id: string;
  type: 'stats';
  title: string;
  description?: string;
  items: DynamicStatItem[];
}

export interface DynamicStatusDescriptor {
  color: DynamicStatusTone;
  label?: string;
}

export interface DynamicTableColumn {
  key: string;
  title: string;
  dataIndex: string;
  align?: 'left' | 'center' | 'right';
  currency?: string;
  presentation?: 'text' | 'currency' | 'status';
  statusMap?: Record<string, DynamicStatusDescriptor>;
}

export type DynamicTableRow = Record<string, DynamicTableCellValue>;

export interface DynamicTableSection {
  id: string;
  type: 'table';
  title: string;
  description?: string;
  createLabel?: string;
  rowKeyField: string;
  columns: DynamicTableColumn[];
  rows: DynamicTableRow[];
}

export interface DynamicRecordDetailField {
  label: string;
  dataIndex: string;
  currency?: string;
  presentation?: 'text' | 'currency' | 'status';
  statusMap?: Record<string, DynamicStatusDescriptor>;
}

export interface DynamicRecordDetailTab {
  key: string;
  label: string;
  columns: DynamicTableColumn[];
  rowDataKey: string;
  emptyText?: string;
}

export interface DynamicRecordListRow {
  key: string;
  cells: DynamicTableRow;
  detailFields?: DynamicRecordDetailField[];
  tabRows?: Record<string, DynamicTableRow[]>;
  lineRows: DynamicTableRow[];
}

export type DynamicRecordDefaultActionKey =
  | 'create'
  | 'importExcel'
  | 'exportExcel'
  | 'attachFile';

export type DynamicRecordActionScope = 'list' | 'detail' | 'both';

export type DynamicRecordActionIcon =
  | 'approve'
  | 'attach'
  | 'download'
  | 'export'
  | 'import'
  | 'mail'
  | 'new'
  | 'print'
  | 'refresh'
  | 'send'
  | 'tool'
  | 'upload';

export interface DynamicRecordDefaultActionConfig {
  label?: string;
  visible?: boolean;
}

export type DynamicRecordDefaultActions = Partial<
  Record<DynamicRecordDefaultActionKey, DynamicRecordDefaultActionConfig>
>;

export interface DynamicRecordToolbarAction {
  key: string;
  label: string;
  icon?: DynamicRecordActionIcon;
  requiresSelection?: boolean;
  scope?: DynamicRecordActionScope;
  targetField?: string;
  tone?: 'default' | 'primary';
  visible?: boolean;
}

export interface DynamicRecordListSection {
  id: string;
  type: 'record-list';
  title: string;
  description?: string;
  createLabel: string;
  defaultActions?: DynamicRecordDefaultActions;
  exportLabel?: string;
  fieldActions?: DynamicRecordToolbarAction[];
  importLabel?: string;
  emptyRecordTitle: string;
  toolbarActions?: DynamicRecordToolbarAction[];
  columns: DynamicTableColumn[];
  detailFields: DynamicRecordDetailField[];
  detailTabs?: DynamicRecordDetailTab[];
  lineColumns: DynamicTableColumn[];
  rows: DynamicRecordListRow[];
}

export interface DynamicTreeNode {
  key: string;
  title: string;
  description?: string;
  recordKey?: string;
  children?: DynamicTreeNode[];
}

export interface DynamicTreeRecordListSection {
  id: string;
  type: 'tree-record-list';
  title: string;
  description?: string;
  treeTitle: string;
  treeSearchPlaceholder?: string;
  treeNodes: DynamicTreeNode[];
  recordList: DynamicRecordListSection;
}

export interface DynamicWorkflowStage {
  key: string;
  title: string;
  description?: string;
  tone?: DynamicStatusTone;
}

export interface DynamicWorkflowTaskMetaItem {
  label: string;
  value: string;
}

export interface DynamicWorkflowTask {
  key: string;
  title: string;
  description?: string;
  stageKey: string;
  owner: string;
  dueLabel?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  statusLabel?: string;
  meta?: DynamicWorkflowTaskMetaItem[];
}

export interface DynamicWorkflowSummaryItem {
  label: string;
  value: string | number;
  helper?: string;
  tone?: 'neutral' | 'positive' | 'warning';
}

export interface DynamicWorkflowSection {
  id: string;
  type: 'workflow';
  title: string;
  description?: string;
  emptyStageText?: string;
  summary?: DynamicWorkflowSummaryItem[];
  stages: DynamicWorkflowStage[];
  tasks: DynamicWorkflowTask[];
}

export interface DynamicFormSection {
  id: string;
  type: 'form';
  title: string;
  description?: string;
  formId: string;
  submitLabel: string;
  successMessage: string;
  snapshotTitle?: string;
  fields: DynamicFormFieldSchema[];
}

export type DynamicPageSection =
  | DynamicHeroSection
  | DynamicStatsSection
  | DynamicTableSection
  | DynamicRecordListSection
  | DynamicTreeRecordListSection
  | DynamicWorkflowSection
  | DynamicFormSection;

export interface DynamicPageSchema {
  badge: string;
  moduleKey: string;
  title: string;
  subtitle: string;
  sections: DynamicPageSection[];
}

export interface DynamicFormSubmissionHandler {
  section: DynamicFormSection;
  values: DynamicFormValues;
}
