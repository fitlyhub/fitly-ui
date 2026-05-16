import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  DownOutlined,
  DragOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  FilterOutlined,
  HolderOutlined,
  HomeOutlined,
  LeftOutlined,
  MailOutlined,
  MenuOutlined,
  MoreOutlined,
  PaperClipOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  RightOutlined,
  SaveOutlined,
  SearchOutlined,
  SendOutlined,
  SettingOutlined,
  ToolOutlined,
  UpOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Dropdown,
  Drawer,
  Input,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type Key,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { DynamicFormRenderer } from '@/engines/dynamic-form';
import type { DynamicFormValues } from '@/engines/dynamic-form';
import type {
  DynamicFormSection,
  DynamicPageSchema,
  DynamicPageSection,
  DynamicRecordActionIcon,
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

const recordActionIconMap: Record<DynamicRecordActionIcon, ReactElement> = {
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

const defaultActionIcons: Record<DynamicRecordDefaultActionKey, ReactElement> = {
  attachFile: <PaperClipOutlined />,
  create: <PlusOutlined />,
  exportExcel: <DownloadOutlined />,
  importExcel: <UploadOutlined />,
};

const getRecordActionIcon = (
  icon: DynamicRecordActionIcon | undefined,
): ReactElement | undefined => {
  return icon ? recordActionIconMap[icon] : undefined;
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
  '!h-9 !rounded-md !px-3 !text-sm !font-semibold';

const toolbarButtonPrimaryClassName = [
  toolbarButtonBaseClassName,
  '!border-teal-700 !bg-teal-700 !text-white hover:!border-teal-800 hover:!bg-teal-800',
].join(' ');

const toolbarButtonSecondaryClassName = [
  toolbarButtonBaseClassName,
  '!border-slate-200 !text-slate-700 hover:!border-teal-200 hover:!text-teal-700',
].join(' ');

const toolbarFilterButtonClassName =
  '!h-9 !w-9 !rounded-md shadow-sm';

const toolbarButtonWidthClassNames = {
  action: '!min-w-[118px]',
  back: '!min-w-[136px]',
  md: '!min-w-[100px]',
  sm: '!min-w-[84px]',
  xl: '!min-w-[140px]',
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
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
        <span>Total {totalRecords} records</span>
        <Select
          aria-label="Rows per page"
          className="w-[150px]"
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
    {
      icon: <DeleteOutlined />,
      label: 'Delete',
      onClick: () => onNotify('Delete'),
      widthClassName: toolbarButtonWidthClassNames.md,
    },
    {
      icon: <PrinterOutlined />,
      label: 'Print',
      onClick: () => onNotify('Print'),
      widthClassName: toolbarButtonWidthClassNames.sm,
    },
    {
      icon: <UploadOutlined />,
      label: 'Import Excel',
      onClick: () => onNotify('Import Excel'),
      widthClassName: toolbarButtonWidthClassNames.xl,
    },
    {
      icon: <DownloadOutlined />,
      label: 'Export',
      onClick: () => onNotify('Export'),
      widthClassName: toolbarButtonWidthClassNames.md,
    },
  ];

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
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

        <Button
          aria-expanded={columnPanelOpen}
          className={[
            toolbarButtonSecondaryClassName,
            toolbarButtonWidthClassNames.action,
          ].join(' ')}
          icon={<MenuOutlined />}
          onClick={onToggleColumnPanel}
        >
          Column <DownOutlined className="ml-1 text-[10px]" />
        </Button>

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
  <label className="grid min-w-0 grid-cols-[128px_minmax(0,1fr)] items-center gap-3 text-sm">
    <span className="truncate font-medium text-slate-600">{label}</span>
    <span className="min-h-9 min-w-0 truncate rounded-md border border-slate-200 bg-white px-3 py-2 font-medium text-slate-800 shadow-[inset_0_1px_0_rgba(15,23,42,0.02)]">
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
  <section className="min-w-0 border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
    <h2 className="m-0 mb-3 text-sm font-semibold text-slate-950">{title}</h2>
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
          icon={defaultActionIcons[actionKey]}
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
          icon={getRecordActionIcon(action.icon)}
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
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-4 py-3">
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
        className="fitly-grid-table-shell min-h-0 flex-1 overflow-hidden"
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
          scroll={{ x: Math.max(scrollWidth, 980), y: tableBodyHeight }}
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

const RecordDetailView = ({
  isCreating,
  page,
  row,
  section,
  onBack,
  onNew,
  onNotify,
}: {
  isCreating: boolean;
  page: DynamicPageSchema;
  row: DynamicRecordListRow | null;
  section: DynamicRecordListSection;
  onBack: () => void;
  onNew: () => void;
  onNotify: (label: string) => void;
}): ReactElement => {
  const splitInitializedRef = useRef(false);
  const splitRef = useRef<HTMLDivElement>(null);
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

  const startSplitResize = (event: ReactMouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();

    const container = splitRef.current;

    if (!container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (mouseEvent: MouseEvent): void => {
      const nextHeight = mouseEvent.clientY - containerRect.top;
      const maxHeight = Math.max(260, containerRect.height - 260);

      setTopPaneHeight(Math.max(220, Math.min(maxHeight, nextHeight)));
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

  useEffect(() => {
    const container = splitRef.current;

    if (!container || splitInitializedRef.current) {
      return;
    }

    const updateInitialSplit = (): void => {
      const containerHeight = container.getBoundingClientRect().height;

      if (containerHeight <= 0 || splitInitializedRef.current) {
        return;
      }

      const maxHeight = Math.max(260, containerHeight - 260);
      const preferredHeight = Math.floor(containerHeight * 0.46);

      setTopPaneHeight(Math.max(220, Math.min(maxHeight, preferredHeight)));
      splitInitializedRef.current = true;
    };

    updateInitialSplit();

    const resizeObserver = new ResizeObserver(updateInitialSplit);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleAction = (key: string): void => {
    const descriptor = actionMenu.descriptors.find((item) => item.key === key);

    onNotify(descriptor?.label ?? key);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 py-4">
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
          <div className="border-b border-slate-200 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-4">
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
                <h1 className="m-0 flex min-h-10 items-center text-xl font-semibold leading-10 text-slate-950">
                  {section.title}: {activeRecordLabel}
                </h1>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
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
              <Button
                className={[
                  toolbarButtonSecondaryClassName,
                  toolbarButtonWidthClassNames.md,
                ].join(' ')}
                icon={<DeleteOutlined />}
                onClick={() => onNotify('Delete')}
              >
                Delete
              </Button>
              <Button
                className={[
                  toolbarButtonSecondaryClassName,
                  toolbarButtonWidthClassNames.sm,
                ].join(' ')}
                icon={<PrinterOutlined />}
                onClick={() => onNotify('Print')}
              >
                Print
              </Button>
              <Button
                className={[
                  toolbarButtonSecondaryClassName,
                  toolbarButtonWidthClassNames.xl,
                ].join(' ')}
                icon={<UploadOutlined />}
                onClick={() => onNotify('Import Excel')}
              >
                Import Excel
              </Button>
              <Button
                className={[
                  toolbarButtonSecondaryClassName,
                  toolbarButtonWidthClassNames.md,
                ].join(' ')}
                icon={<DownloadOutlined />}
                onClick={() => onNotify('Export')}
              >
                Export
              </Button>
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

          <div className="px-4 py-4">
            <DynamicInfoGroup title="General">
              <div className="grid min-w-0 gap-x-6 gap-y-3 lg:grid-cols-2">
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
              className="group flex h-3 shrink-0 cursor-row-resize items-center justify-center border-y border-slate-200 bg-slate-50 hover:bg-teal-50"
              type="button"
              onMouseDown={startSplitResize}
            >
              <DragOutlined className="text-xs text-slate-400 group-hover:text-teal-700" />
            </button>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4">
                <div className="flex min-w-0 items-center gap-4">
                  {detailTabs.map((tab) => (
                    <button
                      key={tab.key}
                      className={[
                        'h-12 cursor-pointer border-0 border-b-2 bg-transparent px-1 text-sm font-semibold transition',
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
                  className="!h-9 !rounded-md !border-slate-200 !text-slate-600 hover:!border-teal-200 hover:!text-teal-700"
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

      <div className="flex h-full min-h-0 flex-col gap-4 py-4">
        <nav
          aria-label="Breadcrumb"
          className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-500"
        >
          <HomeOutlined className="text-slate-400" />
          <span>Home</span>
          <RightOutlined className="text-[10px] text-slate-300" />
          <span>{page.badge}</span>
          <RightOutlined className="text-[10px] text-slate-300" />
          <span className="text-slate-900">{section.title}</span>
        </nav>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="shrink-0 border-b border-slate-200 px-4 py-4">
            <h1 className="m-0 text-xl font-semibold text-slate-950">
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
          case 'form':
            return <FormSection key={section.id} section={section} />;
        }
      })}
    </div>
  );
};
