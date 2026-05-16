import {
  ArrowLeftOutlined,
  CloseOutlined,
  DeleteOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  DownOutlined,
  DragOutlined,
  DownloadOutlined,
  FilterOutlined,
  HolderOutlined,
  HomeOutlined,
  LeftOutlined,
  MenuOutlined,
  MoreOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  RightOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  UpOutlined,
  UploadOutlined,
} from '@/app/config/visual';
import {
  Button,
  Dropdown,
  Drawer,
  Input,
  Select,
  Table,
  Tag,
  Tooltip,
  Tree,
  Typography,
  message,
} from 'antd';
import type { MenuProps, TreeProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type Key,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { DynamicFormRenderer } from '@/engines/dynamic-form';
import type { DynamicFormValues } from '@/engines/dynamic-form';
import {
  dynamicRecordDefaultActionIconConfig,
  getDynamicRecordActionIcon,
} from '@/app/config/visual';
import type {
  DynamicFormSection,
  DynamicPageSchema,
  DynamicPageSection,
  DynamicRecordDefaultActionKey,
  DynamicRecordDetailField,
  DynamicRecordDetailTab,
  DynamicRecordListRow,
  DynamicRecordListSection,
  DynamicRecordToolbarAction,
  DynamicStatusDescriptor,
  DynamicTableCellValue,
  DynamicTableColumn,
  DynamicTableRow,
  DynamicTableSection,
  DynamicTreeNode,
  DynamicTreeRecordListSection,
  DynamicWorkflowSection,
  DynamicWorkflowTask,
} from '@/engines/dynamic-page/model/dynamic-page.types';
import { useWorkspaceStore } from '@/features/workspace/store/useWorkspaceStore';
import { SectionCard } from '@/shared/ui/SectionCard';

interface DynamicPageRendererProps {
  page: DynamicPageSchema;
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

const getCurrencyFormatter = (currency = 'USD'): Intl.NumberFormat => {
  const normalizedCurrency = currency.trim().toUpperCase() || 'USD';
  const cachedFormatter = currencyFormatters.get(normalizedCurrency);

  if (cachedFormatter) {
    return cachedFormatter;
  }

  const formatter = new Intl.NumberFormat('en-US', {
    currency: normalizedCurrency,
    maximumFractionDigits: 0,
    style: 'currency',
  });

  currencyFormatters.set(normalizedCurrency, formatter);

  return formatter;
};

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const getStatusDescriptor = (
  value: DynamicTableCellValue,
  column: DynamicTableColumn,
): DynamicStatusDescriptor => {
  if (value === null) {
    return {
      color: 'default',
      label: '-',
    };
  }

  const rawValue = String(value);

  return column.statusMap?.[rawValue] ?? {
    color: 'default',
    label: rawValue,
  };
};

const renderCell = (
  value: DynamicTableCellValue,
  column: DynamicTableColumn,
): ReactNode => {
  if (value === null) {
    return '-';
  }

  if (column.presentation === 'currency' && typeof value === 'number') {
    return getCurrencyFormatter(column.currency).format(value);
  }

  if (typeof value === 'number') {
    return numberFormatter.format(value);
  }

  if (column.presentation === 'status') {
    const descriptor = getStatusDescriptor(value, column);

    return <Tag color={descriptor.color}>{descriptor.label}</Tag>;
  }

  return String(value);
};

const buildColumns = (
  columns: DynamicTableColumn[],
): ColumnsType<DynamicTableRow> => {
  return columns.map((column) => ({
    key: column.key,
    title: column.title,
    dataIndex: column.dataIndex,
    align: column.align,
    render: (value: DynamicTableCellValue) => renderCell(value, column),
  }));
};

const buildRecordColumns = (
  columns: DynamicTableColumn[],
): ColumnsType<DynamicRecordListRow> => {
  return columns.map((column) => ({
    key: column.key,
    title: column.title,
    align: column.align,
    render: (_value: unknown, row: DynamicRecordListRow) =>
      renderCell(row.cells[column.dataIndex] ?? null, column),
  }));
};

const renderDetailValue = (
  row: DynamicRecordListRow,
  field: DynamicRecordDetailField,
): ReactNode => {
  return renderCell(row.cells[field.dataIndex] ?? null, {
    dataIndex: field.dataIndex,
    key: field.dataIndex,
    currency: field.currency,
    presentation: field.presentation,
    statusMap: field.statusMap,
    title: field.label,
  });
};

const isDefaultActionVisible = (
  section: DynamicRecordListSection,
  actionKey: DynamicRecordDefaultActionKey,
): boolean => {
  return section.defaultActions?.[actionKey]?.visible ?? true;
};

const getDefaultActionLabel = (
  section: DynamicRecordListSection,
  actionKey: DynamicRecordDefaultActionKey,
): string => {
  const configuredLabel = section.defaultActions?.[actionKey]?.label;

  if (configuredLabel) {
    return configuredLabel;
  }

  switch (actionKey) {
    case 'attachFile':
      return 'Attach file';
    case 'create':
      return section.createLabel;
    case 'exportExcel':
      return section.exportLabel ?? 'Export Excel';
    case 'importExcel':
      return section.importLabel ?? 'Import Excel';
  }
};

const getScopedActions = (
  actions: DynamicRecordToolbarAction[] | undefined,
  viewMode: 'detail' | 'list',
): DynamicRecordToolbarAction[] => {
  return (actions ?? []).filter((action) => {
    if (action.visible === false) {
      return false;
    }

    return (action.scope ?? 'both') === 'both' || action.scope === viewMode;
  });
};

const getDetailTabRows = (
  row: DynamicRecordListRow | null,
  tab: DynamicRecordDetailTab,
): DynamicTableRow[] => {
  if (!row) {
    return [];
  }

  if (tab.rowDataKey === 'lineRows') {
    return row.lineRows;
  }

  return row.tabRows?.[tab.rowDataKey] ?? [];
};

interface TableFilterValues {
  fieldValues: Record<string, string>;
  searchText: string;
}

interface TableFilterOption {
  label: string;
  value: string;
}

interface TableFilterColumn {
  column: DynamicTableColumn;
  options: TableFilterOption[];
}

const createEmptyTableFilters = (): TableFilterValues => ({
  fieldValues: {},
  searchText: '',
});

const cloneTableFilters = (filters: TableFilterValues): TableFilterValues => ({
  fieldValues: { ...filters.fieldValues },
  searchText: filters.searchText,
});

const normalizeFilterText = (value: DynamicTableCellValue | string): string => {
  return String(value ?? '').trim().toLocaleLowerCase();
};

const hasActiveTableFilters = (filters: TableFilterValues): boolean => {
  return (
    filters.searchText.trim().length > 0 ||
    Object.values(filters.fieldValues).some((value) => value.trim().length > 0)
  );
};

const getFilterOptionLabel = (
  column: DynamicTableColumn,
  value: string,
): string => {
  if (column.presentation === 'status') {
    return column.statusMap?.[value]?.label ?? value;
  }

  return value;
};

const getTableFilterColumns = <RowType,>(
  columns: DynamicTableColumn[],
  rows: RowType[],
  getValue: (row: RowType, column: DynamicTableColumn) => DynamicTableCellValue,
): TableFilterColumn[] => {
  return columns.reduce<TableFilterColumn[]>((result, column) => {
    if (column.presentation === 'currency') {
      return result;
    }

    const uniqueValues = Array.from(
      new Set(
        rows
          .map((row) => getValue(row, column))
          .filter((value): value is Exclude<DynamicTableCellValue, null> => value !== null)
          .map(String),
      ),
    );

    if (uniqueValues.length < 2 || uniqueValues.length > 12) {
      return result;
    }

    result.push({
      column,
      options: uniqueValues.map((value) => ({
        label: getFilterOptionLabel(column, value),
        value,
      })),
    });

    return result;
  }, []);
};

const applyTableFilters = <RowType,>(
  rows: RowType[],
  columns: DynamicTableColumn[],
  filters: TableFilterValues,
  getValue: (row: RowType, column: DynamicTableColumn) => DynamicTableCellValue,
): RowType[] => {
  const searchText = normalizeFilterText(filters.searchText);
  const activeFieldEntries = Object.entries(filters.fieldValues).filter(
    ([, value]) => value.trim().length > 0,
  );

  if (!searchText && activeFieldEntries.length === 0) {
    return rows;
  }

  return rows.filter((row) => {
    const matchesSearch =
      !searchText ||
      columns.some((column) =>
        normalizeFilterText(getValue(row, column)).includes(searchText),
      );

    if (!matchesSearch) {
      return false;
    }

    return activeFieldEntries.every(([dataIndex, filterValue]) => {
      const column = columns.find((columnItem) => columnItem.dataIndex === dataIndex);

      if (!column) {
        return true;
      }

      return String(getValue(row, column) ?? '') === filterValue;
    });
  });
};

interface TableFilterDrawerProps<RowType> {
  columns: DynamicTableColumn[];
  draftFilters: TableFilterValues;
  getValue: (row: RowType, column: DynamicTableColumn) => DynamicTableCellValue;
  open: boolean;
  rows: RowType[];
  title: string;
  onApply: () => void;
  onChangeDraftFilters: (filters: TableFilterValues) => void;
  onClose: () => void;
  onReset: () => void;
}

const TableFilterDrawer = <RowType,>({
  columns,
  draftFilters,
  getValue,
  open,
  rows,
  title,
  onApply,
  onChangeDraftFilters,
  onClose,
  onReset,
}: TableFilterDrawerProps<RowType>): ReactElement => {
  const filterColumns = useMemo(
    () => getTableFilterColumns(columns, rows, getValue),
    [columns, getValue, rows],
  );

  const updateSearchText = (searchText: string): void => {
    onChangeDraftFilters({
      ...draftFilters,
      searchText,
    });
  };

  const updateFieldValue = (dataIndex: string, value: string | undefined): void => {
    const nextFieldValues = { ...draftFilters.fieldValues };

    if (value) {
      nextFieldValues[dataIndex] = value;
    } else {
      delete nextFieldValues[dataIndex];
    }

    onChangeDraftFilters({
      ...draftFilters,
      fieldValues: nextFieldValues,
    });
  };

  return (
    <Drawer
      destroyOnClose
      extra={
        <Button
          size="small"
          type="primary"
          onClick={onApply}
        >
          Ap dung
        </Button>
      }
      open={open}
      size="default"
      title="Tim kiem & Loc"
      rootClassName="dynamic-table-filter-drawer"
      onClose={onClose}
    >
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
            Tim trong {title}
          </label>
          <Input
            allowClear
            aria-label={`${title} search`}
            placeholder="Nhap tu khoa"
            prefix={<SearchOutlined />}
            value={draftFilters.searchText}
            onChange={(event) => {
              updateSearchText(event.target.value);
            }}
          />
        </div>

        {filterColumns.length > 0 ? (
          <div className="space-y-4">
            <p className="m-0 text-xs font-semibold uppercase text-slate-500">
              Loc theo dieu kien
            </p>
            {filterColumns.map(({ column, options }) => (
              <div key={column.key}>
                <label className="mb-2 block text-xs font-medium text-slate-600">
                  {column.title}
                </label>
                <Select
                  allowClear
                  className="w-full"
                  options={options}
                  placeholder={`Chon ${column.title.toLocaleLowerCase()}`}
                  value={draftFilters.fieldValues[column.dataIndex]}
                  onChange={(value) => {
                    updateFieldValue(column.dataIndex, value);
                  }}
                />
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
          <Button onClick={onReset}>Xoa loc</Button>
          <Button type="primary" onClick={onApply}>
            Ap dung
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

const toneClassMap = {
  neutral: 'text-slate-500',
  positive: 'text-emerald-600',
  warning: 'text-amber-600',
} as const;

const workflowStageClassMap: Record<
  DynamicStatusDescriptor['color'],
  {
    dot: string;
    header: string;
    rail: string;
  }
> = {
  default: {
    dot: 'bg-slate-400',
    header: 'text-slate-700',
    rail: 'border-slate-200 bg-slate-50',
  },
  error: {
    dot: 'bg-rose-500',
    header: 'text-rose-700',
    rail: 'border-rose-200 bg-rose-50/55',
  },
  processing: {
    dot: 'bg-sky-500',
    header: 'text-sky-700',
    rail: 'border-sky-200 bg-sky-50/55',
  },
  success: {
    dot: 'bg-emerald-500',
    header: 'text-emerald-700',
    rail: 'border-emerald-200 bg-emerald-50/55',
  },
  warning: {
    dot: 'bg-amber-500',
    header: 'text-amber-700',
    rail: 'border-amber-200 bg-amber-50/55',
  },
};

const workflowPriorityColorMap: Record<
  NonNullable<DynamicWorkflowTask['priority']>,
  string
> = {
  critical: 'red',
  high: 'orange',
  low: 'default',
  medium: 'gold',
};

const StatsGrid = ({
  section,
}: {
  section: Extract<DynamicPageSection, { type: 'stats' }>;
}): ReactElement => {
  return (
    <SectionCard
      className="rounded-lg border border-slate-200 bg-white"
      styles={{ body: { padding: 16 } }}
      title={section.title}
    >
      {section.description ? (
        <p className="mb-5 text-sm leading-6 text-slate-500">
          {section.description}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {section.items.map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-slate-200/80 bg-slate-50/80 p-3"
          >
            <p className="m-0 text-sm font-medium text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 mb-1 text-xl font-semibold text-slate-950">
              {item.value}
            </p>
            {item.helper ? (
              <p
                className={[
                  'm-0 text-sm',
                  toneClassMap[item.tone ?? 'neutral'],
                ].join(' ')}
              >
                {item.helper}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

const toolbarButtonBaseClassName =
  '!h-8 !rounded-md !px-2.5 !text-xs !font-semibold';

const toolbarButtonPrimaryClassName = [
  toolbarButtonBaseClassName,
  '!border-teal-700 !bg-teal-700 !text-white hover:!border-teal-800 hover:!bg-teal-800',
].join(' ');

const toolbarButtonSecondaryClassName = [
  toolbarButtonBaseClassName,
  '!border-slate-200 !text-slate-700 hover:!border-teal-200 hover:!text-teal-700',
].join(' ');

const toolbarFilterButtonClassName =
  '!h-8 !w-8 !rounded-md shadow-sm';

const toolbarButtonWidthClassNames = {
  action: '!min-w-[92px]',
  back: '!min-w-[118px]',
  md: '!min-w-[88px]',
  sm: '!min-w-[72px]',
  xl: '!min-w-[118px]',
} as const;

type DynamicColumnBucket = 'hidden' | 'visible';

interface DynamicGridColumnConfig {
  align?: 'left' | 'center' | 'right';
  column: DynamicTableColumn;
  dataIndex: string;
  key: string;
  label: string;
  minWidth: number;
}

interface DynamicColumnCustomizerProps {
  hiddenColumns: DynamicGridColumnConfig[];
  open: boolean;
  visibleColumns: DynamicGridColumnConfig[];
  onClose: () => void;
  onMoveColumn: (
    columnKey: string,
    targetBucket: DynamicColumnBucket,
    targetIndex?: number,
  ) => void;
  onReset: () => void;
  onSave: () => void;
}

const getDefaultColumnWidth = (column: DynamicTableColumn): number => {
  if (column.presentation === 'currency') {
    return 148;
  }

  if (column.presentation === 'status') {
    return 132;
  }

  return Math.max(132, Math.min(220, column.title.length * 10 + 72));
};

const createGridColumnConfigs = (
  columns: DynamicTableColumn[],
): DynamicGridColumnConfig[] =>
  columns.map((column) => ({
    align: column.align,
    column,
    dataIndex: column.dataIndex,
    key: column.key,
    label: column.title,
    minWidth: getDefaultColumnWidth(column),
  }));

const removeGridColumn = (
  columns: DynamicGridColumnConfig[],
  columnKey: string,
): {
  column: DynamicGridColumnConfig | undefined;
  columns: DynamicGridColumnConfig[];
} => {
  const column = columns.find((item) => item.key === columnKey);

  return {
    column,
    columns: columns.filter((item) => item.key !== columnKey),
  };
};

const insertGridColumn = (
  columns: DynamicGridColumnConfig[],
  column: DynamicGridColumnConfig,
  targetIndex?: number,
): DynamicGridColumnConfig[] => {
  const nextColumns = [...columns];
  const safeTargetIndex =
    targetIndex === undefined
      ? nextColumns.length
      : Math.max(0, Math.min(targetIndex, nextColumns.length));

  nextColumns.splice(safeTargetIndex, 0, column);

  return nextColumns;
};

const DynamicColumnCustomizer = ({
  hiddenColumns,
  open,
  visibleColumns,
  onClose,
  onMoveColumn,
  onReset,
  onSave,
}: DynamicColumnCustomizerProps): ReactElement | null => {
  const [dragState, setDragState] = useState<{
    columnKey: string;
    sourceBucket: DynamicColumnBucket;
  } | null>(null);

  if (!open) {
    return null;
  }

  const getColumnList = (bucket: DynamicColumnBucket): DynamicGridColumnConfig[] =>
    bucket === 'hidden' ? hiddenColumns : visibleColumns;

  const renderColumnBucket = (
    bucket: DynamicColumnBucket,
    title: string,
  ): ReactElement => {
    const columns = getColumnList(bucket);

    const handleDropOnBucket = (event: DragEvent<HTMLDivElement>): void => {
      event.preventDefault();

      if (!dragState) {
        return;
      }

      onMoveColumn(dragState.columnKey, bucket);
      setDragState(null);
    };

    return (
      <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="m-0 text-sm font-semibold text-slate-900">{title}</p>
          <span className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
            {columns.length}
          </span>
        </div>
        <div
          className="min-h-[248px] space-y-2 rounded-md border border-dashed border-slate-200 bg-white p-2"
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={handleDropOnBucket}
        >
          {columns.map((column, columnIndex) => (
            <div
              key={column.key}
              className={[
                'flex cursor-grab items-center gap-2 rounded-md border bg-white px-2.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition active:cursor-grabbing',
                dragState?.columnKey === column.key
                  ? 'border-teal-300 bg-teal-50'
                  : 'border-slate-200 hover:border-teal-200 hover:text-slate-950',
              ].join(' ')}
              draggable
              onDragStart={() => {
                setDragState({
                  columnKey: column.key,
                  sourceBucket: bucket,
                });
              }}
              onDragEnd={() => {
                setDragState(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();

                if (!dragState) {
                  return;
                }

                const sourceIndex = columns.findIndex(
                  (item) => item.key === dragState.columnKey,
                );
                const targetIndex =
                  dragState.sourceBucket === bucket && sourceIndex < columnIndex
                    ? columnIndex
                    : columnIndex;

                onMoveColumn(dragState.columnKey, bucket, targetIndex);
                setDragState(null);
              }}
            >
              <HolderOutlined className="text-slate-400" />
              <span className="min-w-0 flex-1 truncate">{column.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="absolute right-12 top-[52px] z-30 w-[min(720px,calc(100vw-3rem))] rounded-lg border border-slate-200 bg-white p-4 shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-base font-semibold text-slate-950">
            Tuy chinh cot
          </p>
          <p className="m-0 mt-1 text-xs text-slate-500">
            Keo tha field giua hai cot. Thu tu trong Hien thi la thu tu tren grid.
          </p>
        </div>
        <Button size="small" type="text" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {renderColumnBucket('hidden', 'An')}
        {renderColumnBucket('visible', 'Hien thi')}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
        <Button onClick={onReset}>Dat lai mac dinh</Button>
        <Button type="primary" onClick={onSave}>
          Luu
        </Button>
      </div>
    </div>
  );
};

const DynamicPagination = ({
  currentPage,
  pageSize,
  totalRecords,
  onChangePage,
  onChangePageSize,
}: {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  onChangePage: (page: number) => void;
  onChangePageSize: (pageSize: number) => void;
}): ReactElement => {
  const lastPage = Math.max(1, Math.ceil(totalRecords / pageSize));
  const pages = Array.from(
    { length: Math.min(5, lastPage) },
    (_item, index) => index + 1,
  );

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-700">
        <span>Total {totalRecords} records</span>
        <Select
          aria-label="Rows per page"
          className="w-[132px]"
          options={[
            { label: '20 per page', value: 20 },
            { label: '50 per page', value: 50 },
            { label: '100 per page', value: 100 },
          ]}
          value={pageSize}
          onChange={onChangePageSize}
        />
      </div>

      <div className="flex items-center gap-1">
        <Button
          aria-label="First page"
          className="fitly-page-button"
          disabled={currentPage === 1}
          icon={<DoubleLeftOutlined />}
          onClick={() => {
            onChangePage(1);
          }}
        />
        <Button
          aria-label="Previous page"
          className="fitly-page-button"
          disabled={currentPage === 1}
          icon={<LeftOutlined />}
          onClick={() => {
            onChangePage(Math.max(1, currentPage - 1));
          }}
        />
        {pages.map((page) => (
          <Button
            key={page}
            className={
              page === currentPage
                ? 'fitly-page-button fitly-page-button-active'
                : 'fitly-page-button'
            }
            onClick={() => {
              onChangePage(page);
            }}
          >
            {page}
          </Button>
        ))}
        {lastPage > 5 ? (
          <span className="px-2 text-sm font-semibold text-slate-400">...</span>
        ) : null}
        <Button
          aria-label="Next page"
          className="fitly-page-button"
          disabled={currentPage === lastPage}
          icon={<RightOutlined />}
          onClick={() => {
            onChangePage(Math.min(lastPage, currentPage + 1));
          }}
        />
        <Button
          aria-label="Last page"
          className="fitly-page-button"
          disabled={currentPage === lastPage}
          icon={<DoubleRightOutlined />}
          onClick={() => {
            onChangePage(lastPage);
          }}
        />
      </div>
    </div>
  );
};

interface DynamicGridToolbarProps {
  actionDisabled: boolean;
  actionItems: MenuProps['items'];
  columnPanelOpen: boolean;
  filterAriaLabel: string;
  hasActiveFilters: boolean;
  onAction: (key: string) => void;
  onNew: () => void;
  onNotify: (label: string) => void;
  onOpenFilterPanel: () => void;
  onToggleColumnPanel: () => void;
}

const DynamicGridToolbar = ({
  actionDisabled,
  actionItems,
  columnPanelOpen,
  filterAriaLabel,
  hasActiveFilters,
  onAction,
  onNew,
  onNotify,
  onOpenFilterPanel,
  onToggleColumnPanel,
}: DynamicGridToolbarProps): ReactElement => {
  const toolbarButtons = [
    {
      icon: <ReloadOutlined />,
      label: 'Refresh',
      onClick: () => onNotify('Refresh'),
      widthClassName: toolbarButtonWidthClassNames.md,
    },
    {
      icon: <PlusOutlined />,
      label: 'New',
      onClick: onNew,
      primary: true,
      widthClassName: toolbarButtonWidthClassNames.sm,
    },
    {
      icon: <SaveOutlined />,
      label: 'Save',
      onClick: () => onNotify('Save'),
      widthClassName: toolbarButtonWidthClassNames.sm,
    },
  ];
  const moreItems: MenuProps['items'] = [
    {
      icon: <DeleteOutlined />,
      key: 'delete',
      label: 'Delete',
    },
    {
      icon: <PrinterOutlined />,
      key: 'print',
      label: 'Print',
    },
    {
      icon: <UploadOutlined />,
      key: 'importExcel',
      label: 'Import Excel',
    },
    {
      icon: <DownloadOutlined />,
      key: 'exportExcel',
      label: 'Export Excel',
    },
    {
      icon: <MenuOutlined />,
      key: 'column',
      label: 'Column',
    },
  ];
  const handleMoreClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'delete':
        onNotify('Delete');
        break;
      case 'print':
        onNotify('Print');
        break;
      case 'importExcel':
        onNotify('Import Excel');
        break;
      case 'exportExcel':
        onNotify('Export Excel');
        break;
      case 'column':
        onToggleColumnPanel();
        break;
    }
  };

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {toolbarButtons.map((button) => (
          <Button
            key={button.label}
            className={[
              button.primary
                ? toolbarButtonPrimaryClassName
                : toolbarButtonSecondaryClassName,
              button.widthClassName,
            ].join(' ')}
            icon={button.icon}
            onClick={button.onClick}
          >
            {button.label}
          </Button>
        ))}

        <Dropdown
          menu={{
            items: moreItems,
            onClick: handleMoreClick,
          }}
          trigger={['click']}
        >
          <Button
            aria-expanded={columnPanelOpen}
            className={[
              toolbarButtonSecondaryClassName,
              toolbarButtonWidthClassNames.action,
            ].join(' ')}
            icon={<MoreOutlined />}
          >
            More <DownOutlined className="ml-1 text-[10px]" />
          </Button>
        </Dropdown>

        <Dropdown
          menu={{
            items: actionItems,
            onClick: ({ key }) => {
              onAction(String(key));
            },
          }}
          trigger={['click']}
        >
          <Button
            className={[
              toolbarButtonSecondaryClassName,
              toolbarButtonWidthClassNames.action,
            ].join(' ')}
            disabled={actionDisabled}
            icon={<SettingOutlined />}
          >
            Action <DownOutlined className="ml-1 text-[10px]" />
          </Button>
        </Dropdown>
      </div>

      <Tooltip title="Tim kiem & Loc">
        <Button
          aria-label={filterAriaLabel}
          className={[
            toolbarFilterButtonClassName,
            hasActiveFilters
              ? '!border-teal-700 !bg-teal-700 !text-white hover:!border-teal-800 hover:!bg-teal-800'
              : '!border-slate-200 !bg-white !text-slate-600 hover:!border-teal-200 hover:!text-teal-700',
          ].join(' ')}
          icon={<FilterOutlined />}
          onClick={onOpenFilterPanel}
        />
      </Tooltip>
    </div>
  );
};

const DynamicFieldDisplay = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}): ReactElement => (
  <label className="grid min-w-0 grid-cols-[112px_minmax(0,1fr)] items-center gap-2 text-xs">
    <span className="truncate font-medium text-slate-600">{label}</span>
    <span className="min-h-8 min-w-0 truncate rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-800 shadow-[inset_0_1px_0_rgba(15,23,42,0.02)]">
      {value}
    </span>
  </label>
);

const DynamicInfoGroup = ({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}): ReactElement => (
  <section className="min-w-0 border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
    <h2 className="m-0 mb-2 text-sm font-semibold text-slate-950">{title}</h2>
    {children}
  </section>
);

const LegacyRecordListSection = ({
  section,
}: {
  section: DynamicRecordListSection;
}): ReactElement => {
  const [messageApi, contextHolder] = message.useMessage();
  const [viewMode, setViewMode] = useState<'detail' | 'list'>('list');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeParentTabKey, setActiveParentTabKey] = useState('general');
  const [activeChildTabKey, setActiveChildTabKey] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<TableFilterValues>(
    createEmptyTableFilters,
  );
  const [draftFilters, setDraftFilters] = useState<TableFilterValues>(
    createEmptyTableFilters,
  );
  const getRecordCellValue = (
    row: DynamicRecordListRow,
    column: DynamicTableColumn,
  ): DynamicTableCellValue => row.cells[column.dataIndex] ?? null;
  const filteredRows = useMemo(
    () =>
      applyTableFilters(
        section.rows,
        section.columns,
        appliedFilters,
        getRecordCellValue,
      ),
    [appliedFilters, section.columns, section.rows],
  );
  const selectedRow = useMemo(() => {
    if (isCreating) {
      return null;
    }

    return section.rows.find((row) => row.key === selectedKey) ?? null;
  }, [isCreating, section.rows, selectedKey]);
  const detailTabs = useMemo<DynamicRecordDetailTab[]>(() => {
    if (section.detailTabs?.length) {
      return section.detailTabs;
    }

    return [
      {
        key: 'lines',
        label: 'Lines',
        columns: section.lineColumns,
        rowDataKey: 'lineRows',
      },
    ];
  }, [section.detailTabs, section.lineColumns]);
  const parentTabs = [
    {
      key: 'general',
      label: 'General',
    },
  ];
  const activeChildTab =
    detailTabs.find((tab) => tab.key === activeChildTabKey) ?? detailTabs[0];
  const activeDetailFields = selectedRow?.detailFields ?? section.detailFields;
  const selectedCount = selectedRowKeys.length;
  const detailOpen = viewMode === 'detail';
  const activeRecordCount = detailOpen ? (selectedRow ? 1 : 0) : selectedCount;
  const activeToolbarActions = getScopedActions(section.toolbarActions, viewMode);
  const activeFieldActions = getScopedActions(section.fieldActions, viewMode);
  const activeRecordLabel =
    selectedRow && section.columns[0]
      ? String(selectedRow.cells[section.columns[0].dataIndex] ?? section.title)
      : section.title;
  const hasAppliedFilters = hasActiveTableFilters(appliedFilters);

  const openRecord = (recordKey: string): void => {
    setIsCreating(false);
    setSelectedKey(recordKey);
    setSelectedRowKeys([recordKey]);
    setActiveParentTabKey('general');
    setActiveChildTabKey(detailTabs[0]?.key ?? '');
    setViewMode('detail');
  };

  const openNewRecord = (): void => {
    setIsCreating(true);
    setSelectedKey(null);
    setSelectedRowKeys([]);
    setActiveParentTabKey('general');
    setActiveChildTabKey(detailTabs[0]?.key ?? '');
    setViewMode('detail');
  };

  const closeDetail = (): void => {
    setViewMode('list');
    setIsCreating(false);
  };

  const notifyToolbarAction = (label: string): void => {
    if (viewMode === 'detail' && selectedRow) {
      messageApi.info(`${label}: ${activeRecordLabel}`);
      return;
    }

    messageApi.info(
      activeRecordCount > 0
        ? `${label}: ${activeRecordCount} selected`
        : `${label}: no records selected`,
    );
  };

  const openFilters = (): void => {
    setDraftFilters(cloneTableFilters(appliedFilters));
    setIsFilterOpen(true);
  };

  const applyFilters = (): void => {
    setAppliedFilters(cloneTableFilters(draftFilters));
    setIsFilterOpen(false);
  };

  const resetFilters = (): void => {
    const emptyFilters = createEmptyTableFilters();

    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const renderDefaultActionButton = (
    actionKey: DynamicRecordDefaultActionKey,
    compact = false,
  ): ReactNode => {
    if (!isDefaultActionVisible(section, actionKey)) {
      return null;
    }

    const label = getDefaultActionLabel(section, actionKey);
    const isContextAction = actionKey === 'attachFile';
    const disabled = isContextAction && activeRecordCount === 0;

    return (
      <Tooltip key={actionKey} title={label}>
        <Button
          className={compact ? '!h-8 !w-8' : '!h-8'}
          disabled={disabled}
          icon={dynamicRecordDefaultActionIconConfig[actionKey]}
          type={actionKey === 'create' ? 'primary' : 'default'}
          onClick={
            actionKey === 'create'
              ? openNewRecord
              : () => notifyToolbarAction(label)
          }
        >
          {compact ? null : label}
        </Button>
      </Tooltip>
    );
  };

  const renderConfiguredActionButton = (
    action: DynamicRecordToolbarAction,
    compact = false,
  ): ReactNode => {
    const disabled =
      (Boolean(action.requiresSelection) || Boolean(action.targetField)) &&
      activeRecordCount === 0;

    return (
      <Tooltip key={action.key} title={action.label}>
        <Button
          className={compact ? '!h-8 !w-8' : '!h-8'}
          disabled={disabled}
          icon={getDynamicRecordActionIcon(action.icon)}
          type={action.tone === 'primary' ? 'primary' : 'default'}
          onClick={() => notifyToolbarAction(action.label)}
        >
          {compact ? null : action.label}
        </Button>
      </Tooltip>
    );
  };

  const fixedToolbarButtons = [
    {
      key: 'refresh',
      label: 'Refresh',
      icon: <ReloadOutlined />,
      onClick: () => notifyToolbarAction('Refresh'),
    },
    {
      key: 'new',
      label: 'New',
      icon: <PlusOutlined />,
      onClick: openNewRecord,
      type: 'primary' as const,
    },
    {
      key: 'save',
      label: 'Save',
      icon: <SaveOutlined />,
      disabled: !detailOpen,
      onClick: () => notifyToolbarAction('Save'),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      disabled: activeRecordCount === 0,
      onClick: () => notifyToolbarAction('Delete'),
    },
    {
      key: 'print',
      label: 'Print',
      icon: <PrinterOutlined />,
      disabled: activeRecordCount === 0,
      onClick: () => notifyToolbarAction('Print'),
    },
    {
      key: 'importExcel',
      label: 'Import Excel',
      icon: <UploadOutlined />,
      onClick: () => notifyToolbarAction('Import Excel'),
    },
    {
      key: 'export',
      label: 'Export',
      icon: <DownloadOutlined />,
      onClick: () => notifyToolbarAction('Export'),
    },
    {
      key: 'action',
      label: 'Action',
      icon: <MoreOutlined />,
      disabled: activeRecordCount === 0,
      onClick: () => notifyToolbarAction('Action'),
    },
  ];

  const renderFixedToolbar = (): ReactElement => (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {fixedToolbarButtons.map((button) => (
        <Button
          key={button.key}
          className={
            button.type === 'primary'
              ? '!h-9 !rounded-md !px-3 !font-medium'
              : '!h-9 !rounded-md !border-slate-200 !px-3 !font-medium !text-slate-700'
          }
          disabled={button.disabled}
          icon={button.icon}
          type={button.type ?? 'default'}
          onClick={button.onClick}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );

  return (
    <section className="grid min-h-0 grid-cols-1 gap-4">
      {contextHolder}
      <TableFilterDrawer
        columns={section.columns}
        draftFilters={draftFilters}
        getValue={getRecordCellValue}
        open={isFilterOpen}
        rows={section.rows}
        title={section.title}
        onApply={applyFilters}
        onChangeDraftFilters={setDraftFilters}
        onClose={() => {
          setIsFilterOpen(false);
        }}
        onReset={resetFilters}
      />

      <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <Typography.Title className="!m-0 !text-lg !font-semibold !text-slate-950">
                {section.title}
              </Typography.Title>
              {section.description ? (
                <Typography.Text className="text-sm text-slate-500">
                  {section.description}
                </Typography.Text>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
              <Button
                aria-label={`Open ${section.title} filters`}
                className="!h-8"
                icon={<FilterOutlined />}
                type={hasAppliedFilters ? 'primary' : 'default'}
                onClick={openFilters}
              >
                Filter
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-2">
            {activeRecordCount > 0 ? (
              <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
                {activeRecordCount} selected
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-500">
                Select a row to open details
              </span>
            )}

            {renderFixedToolbar()}
          </div>
        </div>

        <Table<DynamicRecordListRow>
          columns={buildRecordColumns(section.columns)}
          dataSource={filteredRows}
          pagination={false}
          rowClassName={(row) =>
            row.key === selectedKey
              ? '[&>td]:!bg-sky-50 [&>td]:!border-sky-200'
              : 'cursor-pointer'
          }
          rowKey="key"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: 760, y: detailOpen ? 260 : 520 }}
          size="small"
          onRow={(row) => ({
            onClick: (event) => {
              if (
                event.target instanceof Element &&
                event.target.closest('.ant-checkbox-wrapper, .ant-checkbox')
              ) {
                return;
              }

              openRecord(row.key);
            },
          })}
        />
      </div>

      {detailOpen ? (
        <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-start gap-2">
                <Button
                  className="!h-8 !w-8"
                  icon={<ArrowLeftOutlined />}
                  aria-label="Back to list"
                  onClick={closeDetail}
                />
                <div className="min-w-0">
                  <Typography.Title className="!m-0 !text-lg !font-semibold !text-slate-950">
                    {isCreating ? section.emptyRecordTitle : activeRecordLabel}
                  </Typography.Title>
                  <Typography.Text className="text-sm text-slate-500">
                    Details
                  </Typography.Text>
                </div>
              </div>

              <Button
                className="!h-8 !w-8"
                icon={<CloseOutlined />}
                aria-label="Close details"
                onClick={closeDetail}
              />
            </div>
          </div>

          <div className="grid min-h-[560px] grid-rows-[minmax(220px,0.95fr)_minmax(260px,1.05fr)] bg-slate-50/70">
            <div className="min-h-0 overflow-auto border-b border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4">
                <div className="flex gap-5 overflow-x-auto">
                  {parentTabs.map((tab) => (
                    <button
                      key={tab.key}
                      className={[
                        'h-11 shrink-0 cursor-pointer border-0 border-b-2 bg-transparent px-0 text-sm font-medium',
                        activeParentTabKey === tab.key
                          ? 'border-teal-600 text-teal-700'
                          : 'border-transparent text-slate-600 hover:text-slate-950',
                      ].join(' ')}
                      type="button"
                      onClick={() => {
                        setActiveParentTabKey(tab.key);
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-x-4 gap-y-3 px-4 py-4 md:grid-cols-2">
                {activeDetailFields.map((field) => (
                  <div
                    key={field.dataIndex}
                    className="min-w-0 rounded-md border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <p className="m-0 text-[11px] font-semibold uppercase text-slate-500">
                      {field.label}
                    </p>
                    <div className="mt-1 truncate text-sm font-medium text-slate-950">
                      {isCreating || !selectedRow
                        ? '-'
                        : renderDetailValue(selectedRow, field)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-0 overflow-auto bg-white">
              <div className="border-b border-slate-200 px-4">
                <div className="flex gap-5 overflow-x-auto">
                  {detailTabs.map((tab) => (
                    <button
                      key={tab.key}
                      className={[
                        'h-11 shrink-0 cursor-pointer border-0 border-b-2 bg-transparent px-0 text-sm font-medium',
                        activeChildTab?.key === tab.key
                          ? 'border-teal-600 text-teal-700'
                          : 'border-transparent text-slate-600 hover:text-slate-950',
                      ].join(' ')}
                      type="button"
                      onClick={() => {
                        setActiveChildTabKey(tab.key);
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeChildTab ? (
                <div className="px-4 py-4">
                  <Table<DynamicTableRow>
                    columns={buildColumns(activeChildTab.columns)}
                    dataSource={
                      isCreating
                        ? []
                        : getDetailTabRows(selectedRow, activeChildTab)
                    }
                    locale={{ emptyText: activeChildTab.emptyText ?? 'No rows' }}
                    pagination={false}
                    rowKey={(row) => String(row.id)}
                    scroll={{ x: 600 }}
                    size="small"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

const DynamicChildGrid = ({
  columns,
  emptyText,
  filterAriaLabel,
  rows,
  title,
}: {
  columns: DynamicTableColumn[];
  emptyText: string;
  filterAriaLabel: string;
  rows: DynamicTableRow[];
  title: string;
}): ReactElement => {
  const tableShellRef = useRef<HTMLDivElement>(null);
  const defaultVisibleColumns = useMemo(
    () => createGridColumnConfigs(columns),
    [columns],
  );
  const [columnPanelOpen, setColumnPanelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<DynamicGridColumnConfig[]>([]);
  const [pageSize, setPageSize] = useState(20);
  const [quickSearch, setQuickSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<Key[]>([]);
  const [tableBodyHeight, setTableBodyHeight] = useState(240);
  const [visibleColumns, setVisibleColumns] =
    useState<DynamicGridColumnConfig[]>(defaultVisibleColumns);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    defaultVisibleColumns.reduce(
      (result, column) => ({
        ...result,
        [column.key]: column.minWidth,
      }),
      {},
    ),
  );

  useEffect(() => {
    setVisibleColumns(defaultVisibleColumns);
    setHiddenColumns([]);
    setColumnWidths(
      defaultVisibleColumns.reduce(
        (result, column) => ({
          ...result,
          [column.key]: column.minWidth,
        }),
        {},
      ),
    );
    setCurrentPage(1);
    setSelectedRows([]);
  }, [defaultVisibleColumns]);

  useEffect(() => {
    const tableShell = tableShellRef.current;

    if (!tableShell) {
      return;
    }

    const updateTableBodyHeight = (): void => {
      const shellHeight = tableShell.getBoundingClientRect().height;

      setTableBodyHeight(Math.max(112, Math.floor(shellHeight - 48)));
    };

    updateTableBodyHeight();

    const resizeObserver = new ResizeObserver(updateTableBodyHeight);
    resizeObserver.observe(tableShell);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const filteredRows = useMemo(() => {
    const query = quickSearch.trim().toLocaleLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? '').toLocaleLowerCase().includes(query),
      ),
    );
  }, [quickSearch, rows]);
  const pagedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;

    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredRows, pageSize]);
  const shouldCompactGrid = pagedRows.length <= 4;
  const compactTableBodyHeight =
    pagedRows.length === 0 ? 88 : Math.max(88, pagedRows.length * 40 + 16);

  const handleMoveColumn = (
    columnKey: string,
    targetBucket: DynamicColumnBucket,
    targetIndex?: number,
  ): void => {
    const hiddenResult = removeGridColumn(hiddenColumns, columnKey);
    const visibleResult = removeGridColumn(visibleColumns, columnKey);
    const movedColumn = hiddenResult.column ?? visibleResult.column;

    if (!movedColumn) {
      return;
    }

    setHiddenColumns(
      targetBucket === 'hidden'
        ? insertGridColumn(hiddenResult.columns, movedColumn, targetIndex)
        : hiddenResult.columns,
    );
    setVisibleColumns(
      targetBucket === 'visible'
        ? insertGridColumn(visibleResult.columns, movedColumn, targetIndex)
        : visibleResult.columns,
    );
  };

  const startColumnResize = (
    column: DynamicGridColumnConfig,
    event: ReactMouseEvent<HTMLButtonElement>,
  ): void => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = columnWidths[column.key] ?? column.minWidth;
    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (mouseEvent: MouseEvent): void => {
      setColumnWidths((currentWidths) => ({
        ...currentWidths,
        [column.key]: Math.max(
          Math.min(column.minWidth, 120),
          startWidth + mouseEvent.clientX - startX,
        ),
      }));
    };

    const handleMouseUp = (): void => {
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const tableColumns: ColumnsType<DynamicTableRow> = [
    {
      key: 'rowActions',
      render: () => (
        <Button
          aria-label="Row actions"
          className="!h-7 !w-7 !border-0 !bg-transparent !text-slate-500 hover:!bg-slate-100 hover:!text-slate-800"
          icon={<MoreOutlined />}
          type="text"
        />
      ),
      width: 48,
    },
    ...visibleColumns.map((column) => ({
      align: column.align,
      key: column.key,
      render: (_value: unknown, row: DynamicTableRow) =>
        renderCell(row[column.dataIndex] ?? null, column.column),
      title: (
        <div className="fitly-resizable-header">
          <span className="min-w-0 flex-1 truncate">{column.label}</span>
          <button
            aria-label={`Resize ${column.label} column`}
            className="fitly-column-resize-handle"
            type="button"
            onMouseDown={(event) => {
              startColumnResize(column, event);
            }}
          />
        </div>
      ),
      width: columnWidths[column.key] ?? column.minWidth,
    })),
  ];
  const scrollWidth =
    48 +
    visibleColumns.reduce(
      (total, column) => total + (columnWidths[column.key] ?? column.minWidth),
      0,
    );

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <DynamicGridToolbar
        actionDisabled={selectedRows.length === 0}
        actionItems={[
          { key: 'complete', label: 'Complete' },
          { key: 'void', label: 'Void' },
          { key: 'copy', label: 'Copy' },
          { type: 'divider' },
          { key: 'audit-trail', label: 'Audit Trail' },
        ]}
        columnPanelOpen={columnPanelOpen}
        filterAriaLabel={filterAriaLabel}
        hasActiveFilters={filterPanelOpen || quickSearch.trim().length > 0}
        onAction={(key) => {
          message.info(`${key}: ${selectedRows.length} selected`);
        }}
        onNew={() => {
          message.info(`New ${title}`);
        }}
        onNotify={(label) => {
          message.info(`${label}: ${selectedRows.length} selected`);
        }}
        onOpenFilterPanel={() => {
          setFilterPanelOpen((currentValue) => !currentValue);
        }}
        onToggleColumnPanel={() => {
          setColumnPanelOpen((currentValue) => !currentValue);
        }}
      />

      <DynamicColumnCustomizer
        hiddenColumns={hiddenColumns}
        open={columnPanelOpen}
        visibleColumns={visibleColumns}
        onClose={() => {
          setColumnPanelOpen(false);
        }}
        onMoveColumn={handleMoveColumn}
        onReset={() => {
          setHiddenColumns([]);
          setVisibleColumns(defaultVisibleColumns);
        }}
        onSave={() => {
          setColumnPanelOpen(false);
        }}
      />

      {filterPanelOpen ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-3 py-2">
          <Input
            allowClear
            aria-label={filterAriaLabel}
            className="max-w-[460px]"
            placeholder="Search current tab"
            value={quickSearch}
            onChange={(event) => {
              setQuickSearch(event.target.value);
              setCurrentPage(1);
            }}
          />
          <Button
            onClick={() => {
              setQuickSearch('');
              setCurrentPage(1);
            }}
          >
            Reset
          </Button>
        </div>
      ) : null}

      <div
        ref={tableShellRef}
        className={[
          'fitly-grid-table-shell min-h-0 overflow-hidden',
          shouldCompactGrid ? 'fitly-grid-table-shell-compact shrink-0' : 'flex-1',
        ].join(' ')}
      >
        <Table<DynamicTableRow>
          className="fitly-grid-table"
          columns={tableColumns}
          dataSource={pagedRows}
          locale={{ emptyText }}
          pagination={false}
          rowKey={(row, index) => String(row.id ?? index)}
          rowSelection={{
            selectedRowKeys: selectedRows,
            onChange: setSelectedRows,
          }}
          scroll={{
            x: Math.max(scrollWidth, 980),
            y: shouldCompactGrid ? compactTableBodyHeight : tableBodyHeight,
          }}
        />
      </div>

      <DynamicPagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalRecords={filteredRows.length}
        onChangePage={setCurrentPage}
        onChangePageSize={(nextPageSize) => {
          setPageSize(nextPageSize);
          setCurrentPage(1);
        }}
      />
    </div>
  );
};

interface ActionDescriptor {
  disabled?: boolean;
  key: string;
  label: string;
}

const getActionMenu = (
  section: DynamicRecordListSection,
  activeRecordCount: number,
): {
  descriptors: ActionDescriptor[];
  items: MenuProps['items'];
} => {
  const configuredActions = [
    ...(section.toolbarActions ?? []),
    ...(section.fieldActions ?? []),
  ]
    .filter((action) => action.visible !== false)
    .map((action) => ({
      disabled:
        (Boolean(action.requiresSelection) || Boolean(action.targetField)) &&
        activeRecordCount === 0,
      key: action.key,
      label: action.label,
    }));
  const defaultActions: ActionDescriptor[] = [];

  if (isDefaultActionVisible(section, 'attachFile')) {
    defaultActions.push({
      disabled: activeRecordCount === 0,
      key: 'attachFile',
      label: getDefaultActionLabel(section, 'attachFile'),
    });
  }

  if (configuredActions.length === 0 && defaultActions.length === 0) {
    defaultActions.push(
      { key: 'complete', label: 'Complete' },
      { key: 'void', label: 'Void' },
      { key: 'reverse', label: 'Reverse' },
      { key: 'copy', label: 'Copy' },
      { key: 'audit-trail', label: 'Audit Trail' },
    );
  }

  const descriptors = [...configuredActions, ...defaultActions];
  const items: MenuProps['items'] = descriptors.map((item) => ({
    disabled: item.disabled,
    key: item.key,
    label: item.label,
  }));

  return { descriptors, items };
};

const getClampedSplitHeight = (
  value: number,
  containerHeight: number,
  preferredMinHeight: number,
): number => {
  const minimumTopPaneHeight = 120;
  const minimumChildPaneHeight = 170;
  const maxHeight = Math.max(
    minimumTopPaneHeight,
    containerHeight - minimumChildPaneHeight,
  );
  const hasRoomForPreferredMin =
    containerHeight >= preferredMinHeight + minimumChildPaneHeight;
  const minHeight = hasRoomForPreferredMin
    ? Math.min(preferredMinHeight, maxHeight)
    : Math.min(minimumTopPaneHeight, maxHeight);

  return Math.max(minHeight, Math.min(maxHeight, value));
};

const RecordDetailView = ({
  embedded = false,
  initialTopPaneRatio = 0.42,
  isCreating,
  minTopPaneHeight = 120,
  page,
  row,
  section,
  showBackButton = true,
  showBreadcrumb = true,
  onBack,
  onNew,
  onNotify,
}: {
  embedded?: boolean;
  initialTopPaneRatio?: number;
  isCreating: boolean;
  minTopPaneHeight?: number;
  page: DynamicPageSchema;
  row: DynamicRecordListRow | null;
  section: DynamicRecordListSection;
  showBackButton?: boolean;
  showBreadcrumb?: boolean;
  onBack: () => void;
  onNew: () => void;
  onNotify: (label: string) => void;
}): ReactElement => {
  const splitRef = useRef<HTMLDivElement>(null);
  const userResizedSplitRef = useRef(false);
  const detailTabs = useMemo<DynamicRecordDetailTab[]>(() => {
    if (section.detailTabs?.length) {
      return section.detailTabs;
    }

    return [
      {
        key: 'lines',
        label: 'Lines',
        columns: section.lineColumns,
        rowDataKey: 'lineRows',
      },
    ];
  }, [section.detailTabs, section.lineColumns]);
  const [activeChildTabKey, setActiveChildTabKey] = useState(
    detailTabs[0]?.key ?? '',
  );
  const [childPaneCollapsed, setChildPaneCollapsed] = useState(false);
  const [topPaneHeight, setTopPaneHeight] = useState(320);
  const activeChildTab =
    detailTabs.find((tab) => tab.key === activeChildTabKey) ?? detailTabs[0];
  const activeDetailFields = row?.detailFields ?? section.detailFields;
  const activeRecordLabel =
    row && section.columns[0]
      ? String(row.cells[section.columns[0].dataIndex] ?? section.title)
      : section.emptyRecordTitle;
  const actionMenu = getActionMenu(section, row ? 1 : 0);

  const startSplitResize = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ): void => {
    event.preventDefault();
    userResizedSplitRef.current = true;

    const container = splitRef.current;

    if (!container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    event.currentTarget.setPointerCapture(event.pointerId);

    const handlePointerMove = (pointerEvent: PointerEvent): void => {
      const nextHeight = pointerEvent.clientY - containerRect.top;

      setTopPaneHeight(
        getClampedSplitHeight(
          nextHeight,
          containerRect.height,
          minTopPaneHeight,
        ),
      );
    };

    const handlePointerUp = (): void => {
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  useEffect(() => {
    const container = splitRef.current;

    if (!container) {
      return;
    }

    const updateInitialSplit = (): void => {
      if (userResizedSplitRef.current) {
        return;
      }

      const containerHeight = container.getBoundingClientRect().height;

      if (containerHeight <= 0) {
        return;
      }

      const preferredHeight = Math.floor(containerHeight * initialTopPaneRatio);

      setTopPaneHeight(
        getClampedSplitHeight(
          preferredHeight,
          containerHeight,
          minTopPaneHeight,
        ),
      );
    };

    updateInitialSplit();

    const resizeObserver = new ResizeObserver(updateInitialSplit);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [initialTopPaneRatio, minTopPaneHeight]);

  const handleAction = (key: string): void => {
    const descriptor = actionMenu.descriptors.find((item) => item.key === key);

    onNotify(descriptor?.label ?? key);
  };

  return (
    <div
      className={[
        'flex h-full min-h-0 flex-col',
        embedded ? 'gap-0 py-0' : 'gap-4 py-4',
      ].join(' ')}
    >
      {showBreadcrumb ? (
        <nav
          aria-label="Breadcrumb"
          className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-500"
        >
          <HomeOutlined className="text-slate-400" />
          <span>Home</span>
          <RightOutlined className="text-[10px] text-slate-300" />
          <span>{page.badge}</span>
          <RightOutlined className="text-[10px] text-slate-300" />
          <button
            className="cursor-pointer border-0 bg-transparent p-0 text-slate-500 hover:text-teal-700"
            type="button"
            onClick={onBack}
          >
            {section.title}
          </button>
          <RightOutlined className="text-[10px] text-slate-300" />
          <span className="text-slate-900">{activeRecordLabel}</span>
        </nav>
      ) : null}

      <section
        ref={splitRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <div
          className="min-h-0 overflow-y-auto"
          style={{
            flex: childPaneCollapsed ? '1 1 auto' : `0 0 ${topPaneHeight}px`,
          }}
        >
          <div className="border-b border-slate-200 px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {showBackButton ? (
                  <Button
                    className={[
                      toolbarButtonSecondaryClassName,
                      toolbarButtonWidthClassNames.back,
                    ].join(' ')}
                    icon={<LeftOutlined />}
                    onClick={onBack}
                  >
                    Back to List
                  </Button>
                ) : null}
                <h1 className="m-0 flex min-h-8 items-center text-base font-semibold leading-8 text-slate-950">
                  {section.title}: {activeRecordLabel}
                </h1>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                className={[
                  toolbarButtonSecondaryClassName,
                  toolbarButtonWidthClassNames.md,
                ].join(' ')}
                icon={<ReloadOutlined />}
                onClick={() => onNotify('Refresh')}
              >
                Refresh
              </Button>
              <Button
                className={[
                  toolbarButtonSecondaryClassName,
                  toolbarButtonWidthClassNames.sm,
                ].join(' ')}
                icon={<PlusOutlined />}
                onClick={onNew}
              >
                New
              </Button>
              <Button
                className={[
                  toolbarButtonSecondaryClassName,
                  toolbarButtonWidthClassNames.sm,
                ].join(' ')}
                icon={<SaveOutlined />}
                onClick={() => onNotify('Save')}
              >
                Save
              </Button>
              <Dropdown
                menu={{
                  items: [
                    { icon: <DeleteOutlined />, key: 'delete', label: 'Delete' },
                    { icon: <PrinterOutlined />, key: 'print', label: 'Print' },
                    {
                      icon: <UploadOutlined />,
                      key: 'importExcel',
                      label: 'Import Excel',
                    },
                    {
                      icon: <DownloadOutlined />,
                      key: 'exportExcel',
                      label: 'Export Excel',
                    },
                  ],
                  onClick: ({ key }) => {
                    const labels: Record<string, string> = {
                      delete: 'Delete',
                      exportExcel: 'Export Excel',
                      importExcel: 'Import Excel',
                      print: 'Print',
                    };

                    onNotify(labels[String(key)] ?? String(key));
                  },
                }}
                trigger={['click']}
              >
                <Button
                  className={[
                    toolbarButtonSecondaryClassName,
                    toolbarButtonWidthClassNames.action,
                  ].join(' ')}
                  icon={<MoreOutlined />}
                >
                  More <DownOutlined className="ml-1 text-[10px]" />
                </Button>
              </Dropdown>
              <Dropdown
                menu={{
                  items: actionMenu.items,
                  onClick: ({ key }) => {
                    handleAction(String(key));
                  },
                }}
                trigger={['click']}
              >
                <Button
                  className={[
                    toolbarButtonSecondaryClassName,
                    toolbarButtonWidthClassNames.action,
                  ].join(' ')}
                  disabled={actionMenu.items?.length === 0}
                  icon={<SettingOutlined />}
                >
                  Action <DownOutlined className="ml-1 text-[10px]" />
                </Button>
              </Dropdown>
            </div>
          </div>

          <div className="px-3 py-3">
            <DynamicInfoGroup title="General">
              <div className="grid min-w-0 gap-x-4 gap-y-2 lg:grid-cols-2">
                {activeDetailFields.map((field) => (
                  <DynamicFieldDisplay
                    key={field.dataIndex}
                    label={field.label}
                    value={
                      isCreating || !row ? '-' : renderDetailValue(row, field)
                    }
                  />
                ))}
              </div>
            </DynamicInfoGroup>
          </div>
        </div>

        {childPaneCollapsed ? (
          <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4">
            <span className="text-sm font-semibold text-slate-600">
              Child tabs hidden
            </span>
            <Button
              aria-label="Show child tabs"
              className="!h-9 !rounded-md !border-slate-200 !text-slate-600 hover:!border-teal-200 hover:!text-teal-700"
              icon={<DownOutlined />}
              onClick={() => {
                setChildPaneCollapsed(false);
              }}
            >
              Show tabs
            </Button>
          </div>
        ) : (
          <>
            <button
              aria-label={`Resize ${section.title} detail panes`}
              className="group flex h-3 shrink-0 touch-none cursor-row-resize items-center justify-center border-y border-slate-200 bg-slate-50 hover:bg-teal-50"
              type="button"
              onPointerDown={startSplitResize}
            >
              <DragOutlined className="text-xs text-slate-400 group-hover:text-teal-700" />
            </button>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3">
                <div className="flex min-w-0 items-center gap-4 overflow-x-auto">
                  {detailTabs.map((tab) => (
                    <button
                      key={tab.key}
                      className={[
                        'h-10 shrink-0 cursor-pointer border-0 border-b-2 bg-transparent px-1 text-sm font-semibold transition',
                        activeChildTab?.key === tab.key
                          ? 'border-teal-700 text-teal-700'
                          : 'border-transparent text-slate-600 hover:text-slate-950',
                      ].join(' ')}
                      type="button"
                      onClick={() => {
                        setActiveChildTabKey(tab.key);
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <Button
                  aria-label="Hide child tabs"
                  className="!h-8 !rounded-md !border-slate-200 !text-xs !text-slate-600 hover:!border-teal-200 hover:!text-teal-700"
                  icon={<UpOutlined />}
                  onClick={() => {
                    setChildPaneCollapsed(true);
                  }}
                >
                  Hide tabs
                </Button>
              </div>

              {activeChildTab ? (
                <DynamicChildGrid
                  key={activeChildTab.key}
                  columns={activeChildTab.columns}
                  emptyText={activeChildTab.emptyText ?? 'No rows'}
                  filterAriaLabel={`Open ${activeChildTab.label} filters`}
                  rows={isCreating || !row ? [] : getDetailTabRows(row, activeChildTab)}
                  title={activeChildTab.label}
                />
              ) : null}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

const RecordListSection = ({
  page,
  section,
}: {
  page: DynamicPageSchema;
  section: DynamicRecordListSection;
}): ReactElement => {
  const [messageApi, contextHolder] = message.useMessage();
  const tableShellRef = useRef<HTMLDivElement>(null);
  const defaultVisibleColumns = useMemo(
    () => createGridColumnConfigs(section.columns),
    [section.columns],
  );
  const [activeRow, setActiveRow] = useState<DynamicRecordListRow | null>(null);
  const [columnPanelOpen, setColumnPanelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hiddenColumns, setHiddenColumns] = useState<DynamicGridColumnConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [tableBodyHeight, setTableBodyHeight] = useState(360);
  const [visibleColumns, setVisibleColumns] =
    useState<DynamicGridColumnConfig[]>(defaultVisibleColumns);
  const [appliedFilters, setAppliedFilters] = useState<TableFilterValues>(
    createEmptyTableFilters,
  );
  const [draftFilters, setDraftFilters] = useState<TableFilterValues>(
    createEmptyTableFilters,
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    defaultVisibleColumns.reduce(
      (result, column) => ({
        ...result,
        [column.key]: column.minWidth,
      }),
      {},
    ),
  );
  const getRecordCellValue = (
    row: DynamicRecordListRow,
    column: DynamicTableColumn,
  ): DynamicTableCellValue => row.cells[column.dataIndex] ?? null;
  const filteredRows = useMemo(
    () =>
      applyTableFilters(
        section.rows,
        section.columns,
        appliedFilters,
        getRecordCellValue,
      ),
    [appliedFilters, section.columns, section.rows],
  );
  const pagedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;

    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredRows, pageSize]);
  const selectedCount = selectedRowKeys.length;
  const actionMenu = getActionMenu(section, selectedCount);
  const hasAppliedFilters = hasActiveTableFilters(appliedFilters);

  useEffect(() => {
    const tableShell = tableShellRef.current;

    if (!tableShell) {
      return;
    }

    const updateTableBodyHeight = (): void => {
      const shellHeight = tableShell.getBoundingClientRect().height;

      setTableBodyHeight(Math.max(180, Math.floor(shellHeight - 48)));
    };

    updateTableBodyHeight();

    const resizeObserver = new ResizeObserver(updateTableBodyHeight);
    resizeObserver.observe(tableShell);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    setColumnWidths((currentWidths) =>
      visibleColumns.reduce(
        (result, column) => ({
          ...result,
          [column.key]: currentWidths[column.key] ?? column.minWidth,
        }),
        {},
      ),
    );
  }, [visibleColumns]);

  const openFilters = (): void => {
    setDraftFilters(cloneTableFilters(appliedFilters));
    setIsFilterOpen(true);
  };

  const applyFilters = (): void => {
    setAppliedFilters(cloneTableFilters(draftFilters));
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const resetFilters = (): void => {
    const emptyFilters = createEmptyTableFilters();

    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const notifyToolbarAction = (label: string): void => {
    messageApi.info(
      selectedCount > 0
        ? `${label}: ${selectedCount} selected`
        : `${label}: no records selected`,
    );
  };

  const openRecord = (row: DynamicRecordListRow): void => {
    setActiveRow(row);
    setIsCreating(false);
    setSelectedRowKeys([row.key]);
  };

  const openNewRecord = (): void => {
    setActiveRow(null);
    setIsCreating(true);
    setSelectedRowKeys([]);
  };

  const closeDetail = (): void => {
    setActiveRow(null);
    setIsCreating(false);
  };

  const handleAction = (key: string): void => {
    const descriptor = actionMenu.descriptors.find((item) => item.key === key);

    notifyToolbarAction(descriptor?.label ?? key);
  };

  const handleMoveColumn = (
    columnKey: string,
    targetBucket: DynamicColumnBucket,
    targetIndex?: number,
  ): void => {
    const hiddenResult = removeGridColumn(hiddenColumns, columnKey);
    const visibleResult = removeGridColumn(visibleColumns, columnKey);
    const movedColumn = hiddenResult.column ?? visibleResult.column;

    if (!movedColumn) {
      return;
    }

    setHiddenColumns(
      targetBucket === 'hidden'
        ? insertGridColumn(hiddenResult.columns, movedColumn, targetIndex)
        : hiddenResult.columns,
    );
    setVisibleColumns(
      targetBucket === 'visible'
        ? insertGridColumn(visibleResult.columns, movedColumn, targetIndex)
        : visibleResult.columns,
    );
  };

  const startColumnResize = (
    column: DynamicGridColumnConfig,
    event: ReactMouseEvent<HTMLButtonElement>,
  ): void => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = columnWidths[column.key] ?? column.minWidth;
    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (mouseEvent: MouseEvent): void => {
      setColumnWidths((currentWidths) => ({
        ...currentWidths,
        [column.key]: Math.max(
          Math.min(column.minWidth, 120),
          startWidth + mouseEvent.clientX - startX,
        ),
      }));
    };

    const handleMouseUp = (): void => {
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const primaryColumnKey = section.columns[0]?.key;
  const tableColumns: ColumnsType<DynamicRecordListRow> = [
    {
      key: 'rowActions',
      render: () => (
        <Button
          aria-label="Row actions"
          className="!h-7 !w-7 !border-0 !bg-transparent !text-slate-500 hover:!bg-slate-100 hover:!text-slate-800"
          icon={<MoreOutlined />}
          type="text"
          onClick={(event) => {
            event.stopPropagation();
          }}
        />
      ),
      width: 48,
    },
    ...visibleColumns.map((column) => ({
      align: column.align,
      key: column.key,
      render: (_value: unknown, row: DynamicRecordListRow) => {
        const value = renderCell(row.cells[column.dataIndex] ?? null, column.column);

        if (column.key !== primaryColumnKey) {
          return value;
        }

        return (
          <button
            className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-teal-700 hover:text-teal-800"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openRecord(row);
            }}
          >
            {value}
          </button>
        );
      },
      title: (
        <div className="fitly-resizable-header">
          <span className="min-w-0 flex-1 truncate">{column.label}</span>
          <button
            aria-label={`Resize ${column.label} column`}
            className="fitly-column-resize-handle"
            type="button"
            onMouseDown={(event) => {
              startColumnResize(column, event);
            }}
          />
        </div>
      ),
      width: columnWidths[column.key] ?? column.minWidth,
    })),
  ];
  const scrollWidth =
    48 +
    visibleColumns.reduce(
      (total, column) => total + (columnWidths[column.key] ?? column.minWidth),
      0,
    );

  if (activeRow || isCreating) {
    return (
      <>
        {contextHolder}
        <RecordDetailView
          isCreating={isCreating}
          page={page}
          row={activeRow}
          section={section}
          onBack={closeDetail}
          onNew={openNewRecord}
          onNotify={notifyToolbarAction}
        />
      </>
    );
  }

  return (
    <>
      {contextHolder}
      <TableFilterDrawer
        columns={section.columns}
        draftFilters={draftFilters}
        getValue={getRecordCellValue}
        open={isFilterOpen}
        rows={section.rows}
        title={section.title}
        onApply={applyFilters}
        onChangeDraftFilters={setDraftFilters}
        onClose={() => {
          setIsFilterOpen(false);
        }}
        onReset={resetFilters}
      />

      <div className="flex h-full min-h-0 flex-col gap-3 py-3">
        <nav
          aria-label="Breadcrumb"
          className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-500"
        >
          <HomeOutlined className="text-slate-400" />
          <span>Home</span>
          <RightOutlined className="text-[10px] text-slate-300" />
          <span>{page.badge}</span>
          <RightOutlined className="text-[10px] text-slate-300" />
          <span className="text-slate-900">{section.title}</span>
        </nav>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="shrink-0 border-b border-slate-200 px-3 py-3">
            <h1 className="m-0 text-lg font-semibold text-slate-950">
              {section.title}
            </h1>
          </div>

          <div className="relative shrink-0">
            <DynamicGridToolbar
              actionDisabled={selectedCount === 0}
              actionItems={actionMenu.items}
              columnPanelOpen={columnPanelOpen}
              filterAriaLabel={`Open ${section.title} filters`}
              hasActiveFilters={hasAppliedFilters}
              onAction={handleAction}
              onNew={openNewRecord}
              onNotify={notifyToolbarAction}
              onOpenFilterPanel={openFilters}
              onToggleColumnPanel={() => {
                setColumnPanelOpen((currentValue) => !currentValue);
              }}
            />

            <DynamicColumnCustomizer
              hiddenColumns={hiddenColumns}
              open={columnPanelOpen}
              visibleColumns={visibleColumns}
              onClose={() => {
                setColumnPanelOpen(false);
              }}
              onMoveColumn={handleMoveColumn}
              onReset={() => {
                setHiddenColumns([]);
                setVisibleColumns(defaultVisibleColumns);
              }}
              onSave={() => {
                setColumnPanelOpen(false);
              }}
            />
          </div>

          <div
            ref={tableShellRef}
            className="fitly-grid-table-shell min-h-0 flex-1 overflow-hidden"
          >
            <Table<DynamicRecordListRow>
              className="fitly-grid-table"
              columns={tableColumns}
              dataSource={pagedRows}
              pagination={false}
              rowClassName={(row) =>
                selectedRowKeys.includes(row.key)
                  ? 'fitly-grid-row-selected cursor-pointer'
                  : 'cursor-pointer'
              }
              rowKey="key"
              rowSelection={{
                columnTitle:
                  selectedCount > 0 ? (
                    <span className="whitespace-nowrap text-xs font-semibold text-teal-700">
                      {selectedCount} selected
                    </span>
                  ) : undefined,
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              scroll={{ x: Math.max(scrollWidth, 980), y: tableBodyHeight }}
              onRow={(row) => ({
                onClick: (event) => {
                  if (
                    event.target instanceof Element &&
                    event.target.closest(
                      '.ant-checkbox-wrapper, .ant-checkbox, button, a, [role="button"]',
                    )
                  ) {
                    return;
                  }

                  openRecord(row);
                },
              })}
            />
          </div>

          <DynamicPagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalRecords={filteredRows.length}
            onChangePage={setCurrentPage}
            onChangePageSize={(nextPageSize) => {
              setPageSize(nextPageSize);
              setCurrentPage(1);
            }}
          />
        </section>
      </div>
    </>
  );
};

const getFirstTreeRecordKey = (
  nodes: DynamicTreeNode[],
): string | undefined => {
  for (const node of nodes) {
    const recordKey = node.recordKey ?? node.key;

    if (recordKey) {
      return recordKey;
    }

    const childRecordKey = getFirstTreeRecordKey(node.children ?? []);

    if (childRecordKey) {
      return childRecordKey;
    }
  }

  return undefined;
};

const findTreeNode = (
  nodes: DynamicTreeNode[],
  key: string,
): DynamicTreeNode | null => {
  for (const node of nodes) {
    if (node.key === key) {
      return node;
    }

    const childNode = findTreeNode(node.children ?? [], key);

    if (childNode) {
      return childNode;
    }
  }

  return null;
};

const filterTreeNodes = (
  nodes: DynamicTreeNode[],
  query: string,
): DynamicTreeNode[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return nodes;
  }

  return nodes.reduce<DynamicTreeNode[]>((result, node) => {
    const filteredChildren = filterTreeNodes(
      node.children ?? [],
      normalizedQuery,
    );
    const matchesNode = [node.title, node.description]
      .filter(Boolean)
      .some((value) =>
        String(value).toLocaleLowerCase().includes(normalizedQuery),
      );

    if (matchesNode || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren,
      });
    }

    return result;
  }, []);
};

const buildTreeData = (
  nodes: DynamicTreeNode[],
): NonNullable<TreeProps['treeData']> =>
  nodes.map((node) => ({
    key: node.key,
    title: (
      <div className="min-w-0 py-1">
        <div className="truncate text-sm font-semibold text-slate-800">
          {node.title}
        </div>
        {node.description ? (
          <div className="truncate text-xs font-medium text-slate-500">
            {node.description}
          </div>
        ) : null}
      </div>
    ),
    children: node.children?.length ? buildTreeData(node.children) : undefined,
  }));

const TreeRecordListSection = ({
  page,
  section,
}: {
  page: DynamicPageSchema;
  section: DynamicTreeRecordListSection;
}): ReactElement => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isCreating, setIsCreating] = useState(false);
  const [isResizableLayout, setIsResizableLayout] = useState(false);
  const [treePaneWidth, setTreePaneWidth] = useState(360);
  const [treeSearch, setTreeSearch] = useState('');
  const treeSplitRef = useRef<HTMLDivElement>(null);
  const [activeTreeKey, setActiveTreeKey] = useState(
    getFirstTreeRecordKey(section.treeNodes) ?? section.recordList.rows[0]?.key ?? '',
  );
  const visibleTreeNodes = useMemo(
    () => filterTreeNodes(section.treeNodes, treeSearch),
    [section.treeNodes, treeSearch],
  );
  const treeData = useMemo(
    () => buildTreeData(visibleTreeNodes),
    [visibleTreeNodes],
  );
  const activeTreeNode = useMemo(
    () => findTreeNode(section.treeNodes, activeTreeKey),
    [activeTreeKey, section.treeNodes],
  );
  const activeRecordKey = activeTreeNode?.recordKey ?? activeTreeKey;
  const activeRow =
    section.recordList.rows.find((row) => row.key === activeRecordKey) ?? null;
  const selectedTreeKeys = activeTreeKey ? [activeTreeKey] : [];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const updateLayoutMode = (): void => {
      setIsResizableLayout(mediaQuery.matches);
    };

    updateLayoutMode();
    mediaQuery.addEventListener('change', updateLayoutMode);

    return () => {
      mediaQuery.removeEventListener('change', updateLayoutMode);
    };
  }, []);

  const notifyToolbarAction = (label: string): void => {
    const recordLabel =
      activeRow && section.recordList.columns[0]
        ? String(
            activeRow.cells[section.recordList.columns[0].dataIndex] ??
              section.recordList.title,
          )
        : section.recordList.title;

    messageApi.info(`${label}: ${recordLabel}`);
  };

  const startTreePaneResize = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ): void => {
    event.preventDefault();

    const container = treeSplitRef.current;

    if (!container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    event.currentTarget.setPointerCapture(event.pointerId);

    const handlePointerMove = (pointerEvent: PointerEvent): void => {
      const maxTreeWidth = Math.max(320, containerRect.width - 640);
      const nextWidth = pointerEvent.clientX - containerRect.left;

      setTreePaneWidth(Math.max(300, Math.min(maxTreeWidth, nextWidth)));
    };

    const handlePointerUp = (): void => {
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  return (
    <>
      {contextHolder}
      <div
        ref={treeSplitRef}
        className="grid h-full min-h-0 grid-cols-1 gap-4 pt-3 pb-1 xl:gap-0"
        style={
          isResizableLayout
            ? {
                gridTemplateColumns: `${treePaneWidth}px 14px minmax(0, 1fr)`,
              }
            : undefined
        }
      >
        <section className="flex min-h-[360px] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm xl:h-full xl:min-h-0">
          <div className="shrink-0 border-b border-slate-200 px-4 py-4">
            <p className="m-0 text-xs font-semibold uppercase text-teal-700">
              {page.badge}
            </p>
            <h1 className="m-0 mt-1 text-xl font-semibold text-slate-950">
              {section.treeTitle}
            </h1>
            {section.description ? (
              <p className="m-0 mt-1 text-sm leading-6 text-slate-500">
                {section.description}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-4 py-3">
            <Input
              allowClear
              aria-label={`${section.treeTitle} search`}
              placeholder={section.treeSearchPlaceholder ?? 'Search tree'}
              prefix={<SearchOutlined />}
              value={treeSearch}
              onChange={(event) => {
                setTreeSearch(event.target.value);
              }}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-3">
            <Tree
              blockNode
              defaultExpandAll
              selectedKeys={selectedTreeKeys}
              treeData={treeData}
              onSelect={(selectedKeys) => {
                const nextTreeKey = selectedKeys[0];

                if (nextTreeKey === undefined) {
                  return;
                }

                setActiveTreeKey(String(nextTreeKey));
                setIsCreating(false);
              }}
            />
          </div>
        </section>

        <div className="hidden min-h-0 items-stretch justify-center px-1 xl:flex">
          <button
            aria-label="Resize organization tree and detail layout"
            className="group flex h-full w-3 cursor-col-resize items-center justify-center rounded-md border border-transparent bg-transparent hover:border-teal-100 hover:bg-teal-50"
            type="button"
            onPointerDown={startTreePaneResize}
          >
            <span className="h-14 w-1 rounded-full bg-slate-300 transition group-hover:bg-teal-600" />
          </button>
        </div>

        <div className="min-h-[720px] min-w-0 xl:h-full xl:min-h-0">
          <RecordDetailView
            embedded
            initialTopPaneRatio={0.72}
            isCreating={isCreating}
            minTopPaneHeight={320}
            page={page}
            row={isCreating ? null : activeRow}
            section={section.recordList}
            showBackButton={false}
            showBreadcrumb={false}
            onBack={() => {
              setIsCreating(false);
            }}
            onNew={() => {
              setIsCreating(true);
            }}
            onNotify={notifyToolbarAction}
          />
        </div>
      </div>
    </>
  );
};

const workflowContextColumns: DynamicTableColumn[] = [
  {
    key: 'label',
    title: 'Field',
    dataIndex: 'label',
  },
  {
    key: 'value',
    title: 'Value',
    dataIndex: 'value',
  },
];

const workflowActivityColumns: DynamicTableColumn[] = [
  {
    key: 'time',
    title: 'Time',
    dataIndex: 'time',
  },
  {
    key: 'actor',
    title: 'Actor',
    dataIndex: 'actor',
  },
  {
    key: 'activity',
    title: 'Activity',
    dataIndex: 'activity',
  },
];

const getWorkflowStageTitle = (
  section: DynamicWorkflowSection,
  stageKey: string,
): string =>
  section.stages.find((stage) => stage.key === stageKey)?.title ?? stageKey;

const buildWorkflowRecordDetail = (
  section: DynamicWorkflowSection,
  task: DynamicWorkflowTask,
): {
  row: DynamicRecordListRow;
  section: DynamicRecordListSection;
} => {
  const contextRows: DynamicTableRow[] = (task.meta ?? []).map((item) => ({
    id: `${task.key}-context-${item.label}`,
    label: item.label,
    value: item.value,
  }));
  const activityRows: DynamicTableRow[] = [
    {
      id: `${task.key}-activity-opened`,
      time: task.dueLabel ?? '-',
      actor: task.owner,
      activity: task.statusLabel ?? 'Task opened',
    },
    {
      id: `${task.key}-activity-stage`,
      time: 'Current',
      actor: 'Workflow',
      activity: `Stage: ${getWorkflowStageTitle(section, task.stageKey)}`,
    },
  ];
  const row: DynamicRecordListRow = {
    key: task.key,
    cells: {
      description: task.description ?? '-',
      due: task.dueLabel ?? '-',
      owner: task.owner,
      priority: task.priority ?? '-',
      stage: getWorkflowStageTitle(section, task.stageKey),
      status: task.statusLabel ?? '-',
      title: task.title,
    },
    detailFields: [
      {
        label: 'Title',
        dataIndex: 'title',
      },
      {
        label: 'Owner',
        dataIndex: 'owner',
      },
      {
        label: 'Due',
        dataIndex: 'due',
      },
      {
        label: 'Status',
        dataIndex: 'status',
      },
      {
        label: 'Priority',
        dataIndex: 'priority',
      },
      {
        label: 'Stage',
        dataIndex: 'stage',
      },
      {
        label: 'Description',
        dataIndex: 'description',
      },
    ],
    lineRows: contextRows,
    tabRows: {
      activity: activityRows,
      context: contextRows,
    },
  };

  return {
    row,
    section: {
      id: `${section.id}-detail`,
      type: 'record-list',
      title: section.title,
      createLabel: 'New Task',
      defaultActions: {
        attachFile: {
          label: 'Attach file',
          visible: true,
        },
        create: {
          label: 'New Task',
          visible: true,
        },
        exportExcel: {
          visible: false,
        },
        importExcel: {
          visible: false,
        },
      },
      emptyRecordTitle: 'New Task',
      toolbarActions: [
        {
          key: 'approve-task',
          label: 'Approve',
          icon: 'approve',
          requiresSelection: true,
          scope: 'detail',
          tone: 'primary',
        },
      ],
      columns: [
        {
          key: 'title',
          title: 'Task',
          dataIndex: 'title',
        },
        {
          key: 'owner',
          title: 'Owner',
          dataIndex: 'owner',
        },
        {
          key: 'status',
          title: 'Status',
          dataIndex: 'status',
        },
      ],
      detailFields: row.detailFields ?? [],
      detailTabs: [
        {
          key: 'context',
          label: 'Context',
          columns: workflowContextColumns,
          rowDataKey: 'context',
          emptyText: 'No context',
        },
        {
          key: 'activity',
          label: 'Activity',
          columns: workflowActivityColumns,
          rowDataKey: 'activity',
          emptyText: 'No activity',
        },
      ],
      lineColumns: workflowContextColumns,
      rows: [row],
    },
  };
};

const WorkflowSection = ({
  page,
  section,
}: {
  page: DynamicPageSchema;
  section: DynamicWorkflowSection;
}): ReactElement => {
  const suppressTaskClickRef = useRef(false);
  const [activeTaskKey, setActiveTaskKey] = useState<string | null>(null);
  const [draggedTaskKey, setDraggedTaskKey] = useState<string | null>(null);
  const [tasks, setTasks] = useState<DynamicWorkflowTask[]>(section.tasks);
  const tasksByStage = useMemo(() => {
    return section.stages.reduce<Record<string, DynamicWorkflowTask[]>>(
      (result, stage) => ({
        ...result,
        [stage.key]: tasks.filter((task) => task.stageKey === stage.key),
      }),
      {},
    );
  }, [section.stages, tasks]);
  const activeTask = activeTaskKey
    ? tasks.find((task) => task.key === activeTaskKey) ?? null
    : null;
  const activeTaskDetail = useMemo(
    () => (activeTask ? buildWorkflowRecordDetail(section, activeTask) : null),
    [activeTask, section],
  );

  useEffect(() => {
    setTasks(section.tasks);
    setActiveTaskKey((currentTaskKey) =>
      currentTaskKey && section.tasks.some((task) => task.key === currentTaskKey)
        ? currentTaskKey
        : null,
    );
    setDraggedTaskKey(null);
  }, [section.tasks]);

  const moveTask = (
    taskKey: string,
    nextStageKey: string,
    beforeTaskKey?: string,
  ): void => {
    setTasks((currentTasks) => {
      const movingTask = currentTasks.find((task) => task.key === taskKey);

      if (!movingTask) {
        return currentTasks;
      }

      const nextMovingTask = {
        ...movingTask,
        stageKey: nextStageKey,
      };
      const remainingTasks = currentTasks.filter((task) => task.key !== taskKey);

      if (!beforeTaskKey) {
        return [...remainingTasks, nextMovingTask];
      }

      const targetIndex = remainingTasks.findIndex(
        (task) => task.key === beforeTaskKey,
      );

      if (targetIndex === -1) {
        return [...remainingTasks, nextMovingTask];
      }

      return [
        ...remainingTasks.slice(0, targetIndex),
        nextMovingTask,
        ...remainingTasks.slice(targetIndex),
      ];
    });
  };

  const suppressNextTaskClick = (): void => {
    suppressTaskClickRef.current = true;
    window.setTimeout(() => {
      suppressTaskClickRef.current = false;
    }, 0);
  };

  const handleDropOnStage = (
    stageKey: string,
    event: DragEvent<HTMLElement>,
  ): void => {
    event.preventDefault();

    if (!draggedTaskKey) {
      return;
    }

    moveTask(draggedTaskKey, stageKey);
    suppressNextTaskClick();
    setDraggedTaskKey(null);
  };

  const handleDropOnTask = (
    stageKey: string,
    targetTaskKey: string,
    event: DragEvent<HTMLElement>,
  ): void => {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedTaskKey || draggedTaskKey === targetTaskKey) {
      return;
    }

    moveTask(draggedTaskKey, stageKey, targetTaskKey);
    suppressNextTaskClick();
    setDraggedTaskKey(null);
  };

  if (activeTaskDetail) {
    return (
      <RecordDetailView
        isCreating={false}
        page={page}
        row={activeTaskDetail.row}
        section={activeTaskDetail.section}
        onBack={() => {
          setActiveTaskKey(null);
        }}
        onNew={() => {
          setActiveTaskKey(null);
          message.info(`New task in ${section.title}`);
        }}
        onNotify={(label) => {
          message.info(`${label}: ${activeTaskDetail.row.cells.title}`);
        }}
      />
    );
  }

  return (
    <section className="flex min-h-[720px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Typography.Title className="!m-0 !text-xl !font-semibold !text-slate-950">
              {section.title}
            </Typography.Title>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className={toolbarButtonSecondaryClassName}
              icon={<ReloadOutlined />}
              onClick={() => {
                message.info(`Refresh ${section.title}`);
              }}
            >
              Refresh
            </Button>
            <Button
              className={toolbarButtonPrimaryClassName}
              icon={<PlusOutlined />}
              onClick={() => {
                message.info(`New task in ${section.title}`);
              }}
            >
              New Task
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto bg-slate-100/60 p-3">
        <div
          className="grid min-h-full gap-3"
          style={{
            gridTemplateColumns: `repeat(${section.stages.length}, minmax(280px, 1fr))`,
          }}
        >
          {section.stages.map((stage) => {
            const stageTasks = tasksByStage[stage.key] ?? [];
            const stageClasses =
              workflowStageClassMap[stage.tone ?? 'default'];

            return (
              <div
                key={stage.key}
                className={[
                  'flex min-h-0 flex-col rounded-lg border p-3',
                  draggedTaskKey ? 'ring-1 ring-inset ring-teal-500/20' : '',
                  stageClasses.rail,
                ].join(' ')}
                data-workflow-stage-key={stage.key}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  handleDropOnStage(stage.key, event);
                }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          'h-2.5 w-2.5 shrink-0 rounded-full',
                          stageClasses.dot,
                        ].join(' ')}
                      />
                      <h2
                        className={[
                          'm-0 truncate text-sm font-semibold',
                          stageClasses.header,
                        ].join(' ')}
                      >
                        {stage.title}
                      </h2>
                    </div>
                    {stage.description ? (
                      <p className="m-0 mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {stage.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {stageTasks.length}
                  </span>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {stageTasks.length > 0 ? (
                    stageTasks.map((task) => {
                      const isDragging = draggedTaskKey === task.key;

                      return (
                        <button
                          key={task.key}
                          className={[
                            'w-full cursor-grab rounded-md border bg-white p-3 text-left shadow-sm transition active:cursor-grabbing',
                            isDragging
                              ? 'border-teal-500 opacity-55 ring-2 ring-teal-500/15'
                              : 'border-slate-200 hover:border-teal-200 hover:shadow',
                          ].join(' ')}
                          data-workflow-task-key={task.key}
                          draggable
                          type="button"
                          onClick={() => {
                            if (suppressTaskClickRef.current) {
                              return;
                            }

                            setActiveTaskKey(task.key);
                          }}
                          onDragEnd={() => {
                            setDraggedTaskKey(null);
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                          }}
                          onDragStart={(event) => {
                            setDraggedTaskKey(task.key);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', task.key);
                          }}
                          onDrop={(event) => {
                            handleDropOnTask(stage.key, task.key, event);
                          }}
                        >
                          <div className="flex min-w-0 items-start justify-between gap-2">
                            <p className="m-0 min-w-0 flex-1 text-sm font-semibold leading-5 text-slate-950">
                              {task.title}
                            </p>
                            {task.priority ? (
                              <Tag color={workflowPriorityColorMap[task.priority]}>
                                {task.priority}
                              </Tag>
                            ) : null}
                          </div>
                          {task.description ? (
                            <p className="m-0 mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                              {task.description}
                            </p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                            <span className="rounded bg-slate-100 px-2 py-1">
                              {task.owner}
                            </span>
                            {task.dueLabel ? (
                              <span className="rounded bg-slate-100 px-2 py-1">
                                {task.dueLabel}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-md border border-dashed border-slate-300 bg-white/70 p-4 text-center text-sm font-medium text-slate-500">
                      {section.emptyStageText ?? 'No tasks'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const TableSection = ({
  section,
}: {
  section: DynamicTableSection;
}): ReactElement => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<TableFilterValues>(
    createEmptyTableFilters,
  );
  const [draftFilters, setDraftFilters] = useState<TableFilterValues>(
    createEmptyTableFilters,
  );
  const getRowValue = (
    row: DynamicTableRow,
    column: DynamicTableColumn,
  ): DynamicTableCellValue => row[column.dataIndex] ?? null;
  const filteredRows = useMemo(
    () =>
      applyTableFilters(section.rows, section.columns, appliedFilters, getRowValue),
    [appliedFilters, section.columns, section.rows],
  );
  const hasAppliedFilters = hasActiveTableFilters(appliedFilters);

  const openFilters = (): void => {
    setDraftFilters(cloneTableFilters(appliedFilters));
    setIsFilterOpen(true);
  };

  const applyFilters = (): void => {
    setAppliedFilters(cloneTableFilters(draftFilters));
    setIsFilterOpen(false);
  };

  const resetFilters = (): void => {
    const emptyFilters = createEmptyTableFilters();

    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  return (
    <>
      <TableFilterDrawer
        columns={section.columns}
        draftFilters={draftFilters}
        getValue={getRowValue}
        open={isFilterOpen}
        rows={section.rows}
        title={section.title}
        onApply={applyFilters}
        onChangeDraftFilters={setDraftFilters}
        onClose={() => {
          setIsFilterOpen(false);
        }}
        onReset={resetFilters}
      />

      <SectionCard
        className="rounded-lg border border-slate-200 bg-white"
        styles={{ body: { padding: 16 } }}
        title={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{section.title}</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="small"
                icon={<FilterOutlined />}
                type={hasAppliedFilters ? 'primary' : 'default'}
                onClick={openFilters}
              >
                Filter
              </Button>
              {section.createLabel ? (
                <Button size="small" type="primary">
                  {section.createLabel}
                </Button>
              ) : null}
            </div>
          </div>
        }
      >
        {section.description ? (
          <p className="mb-5 text-sm leading-6 text-slate-500">
            {section.description}
          </p>
        ) : null}

        <Table<DynamicTableRow>
          columns={buildColumns(section.columns)}
          dataSource={filteredRows}
          pagination={false}
          rowKey={section.rowKeyField}
          scroll={{ x: 760 }}
          size="small"
        />
      </SectionCard>
    </>
  );
};

const FormSection = ({
  section,
}: {
  section: DynamicFormSection;
}): ReactElement => {
  const [messageApi, contextHolder] = message.useMessage();
  const lastSubmission = useWorkspaceStore(
    (state) => state.formSubmissions[section.formId] ?? null,
  );
  const setFormSubmission = useWorkspaceStore((state) => state.setFormSubmission);

  const handleSubmit = async (values: DynamicFormValues): Promise<void> => {
    setFormSubmission(section.formId, values);
    messageApi.success(section.successMessage);
  };

  return (
    <>
      {contextHolder}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <SectionCard
          className="rounded-lg border border-slate-200 bg-white"
          styles={{ body: { padding: 16 } }}
          title={section.title}
        >
          {section.description ? (
            <p className="mb-5 text-sm leading-6 text-slate-500">
              {section.description}
            </p>
          ) : null}

          <DynamicFormRenderer
            schema={section.fields}
            submitLabel={section.submitLabel}
            onSubmit={handleSubmit}
          />
        </SectionCard>

        <SectionCard
          className="rounded-lg border-0 bg-slate-950 text-slate-100"
          styles={{ body: { padding: 16 } }}
          title={section.snapshotTitle ?? 'Latest payload'}
        >
          <pre className="m-0 overflow-auto rounded-2xl bg-slate-900/90 p-4 text-xs leading-6 text-teal-100">
            {lastSubmission
              ? JSON.stringify(lastSubmission, null, 2)
              : 'No submission yet'}
          </pre>
        </SectionCard>
      </div>
    </>
  );
};

export const DynamicPageRenderer = ({
  page,
}: DynamicPageRendererProps): ReactElement => {
  return (
    <div className="h-full min-h-0 space-y-4">
      {page.sections.map((section) => {
        switch (section.type) {
          case 'hero':
            return (
              <section
                key={section.id}
                className="overflow-hidden rounded-lg border border-teal-200/60 bg-white px-4 py-3 shadow-sm"
              >
                <p className="m-0 text-xs font-semibold uppercase text-teal-700">
                  {section.eyebrow}
                </p>
                <Typography.Title className="!mt-1 !mb-1 !text-2xl !font-semibold !text-slate-950">
                  {section.title}
                </Typography.Title>
                <Typography.Paragraph className="!m-0 !max-w-4xl !text-sm !leading-6 !text-slate-600">
                  {section.description}
                </Typography.Paragraph>
              </section>
            );
          case 'stats':
            return <StatsGrid key={section.id} section={section} />;
          case 'table':
            return <TableSection key={section.id} section={section} />;
          case 'record-list':
            return (
              <RecordListSection
                key={section.id}
                page={page}
                section={section}
              />
            );
          case 'tree-record-list':
            return (
              <TreeRecordListSection
                key={section.id}
                page={page}
                section={section}
              />
            );
          case 'workflow':
            return (
              <WorkflowSection
                key={section.id}
                page={page}
                section={section}
              />
            );
          case 'form':
            return <FormSection key={section.id} section={section} />;
        }
      })}
    </div>
  );
};
