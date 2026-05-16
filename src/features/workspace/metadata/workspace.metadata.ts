import type { DynamicFormFieldSchema } from '@/engines/dynamic-form';
import type {
  DynamicPageSchema,
  DynamicRecordDetailField,
  DynamicRecordDetailTab,
  DynamicRecordListRow,
  DynamicStatusDescriptor,
  DynamicTableColumn,
  DynamicTableRow,
} from '@/engines/dynamic-page';
import { userFormMetadataResponse } from '@/features/dynamic-form-demo/metadata/user-form.metadata';
import type {
  WorkspaceModuleKey,
  WorkspaceModuleSchema,
  WorkspaceNavItem,
} from '@/features/workspace/model/workspace.types';
import {
  defaultHiddenColumns as salesOrderHiddenColumns,
  defaultHiddenOrderLineColumns as salesOrderHiddenLineColumns,
  defaultHiddenPaymentColumns as salesOrderHiddenPaymentColumns,
  defaultVisibleColumns as salesOrderVisibleColumns,
  defaultVisibleOrderLineColumns as salesOrderVisibleLineColumns,
  defaultVisiblePaymentColumns as salesOrderVisiblePaymentColumns,
  orderLineRowsByOrderId,
  paymentRowsByOrderId,
  salesOrderRows as salesOrderGridRows,
  type GridColumnConfig,
} from '@/features/workspace/metadata/sales-document-record.mock';

const approvalStatusMap: Record<string, DynamicStatusDescriptor> = {
  blocked: {
    color: 'error',
    label: 'Blocked',
  },
  review: {
    color: 'processing',
    label: 'In review',
  },
  ready: {
    color: 'success',
    label: 'Ready',
  },
};

const poStatusMap: Record<string, DynamicStatusDescriptor> = {
  approved: {
    color: 'success',
    label: 'Approved',
  },
  draft: {
    color: 'default',
    label: 'Draft',
  },
  pending: {
    color: 'warning',
    label: 'Pending',
  },
};

const salesOrderStatusMap: Record<string, DynamicStatusDescriptor> = {
  cancelled: {
    color: 'error',
    label: 'Cancelled',
  },
  completed: {
    color: 'success',
    label: 'Completed',
  },
  confirmed: {
    color: 'success',
    label: 'Confirmed',
  },
  draft: {
    color: 'default',
    label: 'Draft',
  },
  processing: {
    color: 'warning',
    label: 'Processing',
  },
  shipped: {
    color: 'processing',
    label: 'Shipped',
  },
};

const salesOrderCurrencyKeys = new Set([
  'amount',
  'expectedAmount',
  'grandTotal',
  'paidAmount',
  'unitPrice',
]);

const toDynamicColumn = (
  column: GridColumnConfig,
  statusMap?: Record<string, DynamicStatusDescriptor>,
): DynamicTableColumn => {
  const isCurrency = salesOrderCurrencyKeys.has(column.key);
  const isStatus = column.key === 'status';

  return {
    key: column.key,
    title: column.label,
    dataIndex: column.key,
    align: column.align,
    currency: isCurrency ? 'VND' : undefined,
    presentation: isStatus ? 'status' : isCurrency ? 'currency' : 'text',
    statusMap: isStatus ? statusMap : undefined,
  };
};

const toDetailField = (
  column: GridColumnConfig,
  statusMap?: Record<string, DynamicStatusDescriptor>,
): DynamicRecordDetailField => {
  const dynamicColumn = toDynamicColumn(column, statusMap);

  return {
    label: column.label,
    dataIndex: column.key,
    currency: dynamicColumn.currency,
    presentation: dynamicColumn.presentation,
    statusMap: dynamicColumn.statusMap,
  };
};

const salesOrderColumns = salesOrderVisibleColumns.map((column) =>
  toDynamicColumn(column, salesOrderStatusMap),
);

const salesOrderDetailFields = [
  ...salesOrderVisibleColumns,
  ...salesOrderHiddenColumns,
].map((column) => toDetailField(column, salesOrderStatusMap));

const salesOrderLineColumns = [
  ...salesOrderVisibleLineColumns,
  ...salesOrderHiddenLineColumns,
].map((column) => toDynamicColumn(column));

const salesOrderPaymentColumns = [
  ...salesOrderVisiblePaymentColumns,
  ...salesOrderHiddenPaymentColumns,
].map((column) => toDynamicColumn(column));

const salesOrderDocumentColumns: DynamicTableColumn[] = [
  {
    key: 'document',
    title: 'Document',
    dataIndex: 'document',
  },
  {
    key: 'type',
    title: 'Type',
    dataIndex: 'type',
  },
  {
    key: 'uploadedBy',
    title: 'Uploaded By',
    dataIndex: 'uploadedBy',
  },
];

const activityColumns: DynamicTableColumn[] = [
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

const salesOrderDetailTabs: DynamicRecordDetailTab[] = [
  {
    key: 'order-lines',
    label: 'Order Lines',
    columns: salesOrderLineColumns,
    rowDataKey: 'lineRows',
    emptyText: 'No order lines',
  },
  {
    key: 'payments',
    label: 'Payment',
    columns: salesOrderPaymentColumns,
    rowDataKey: 'payments',
    emptyText: 'No payment schedules',
  },
  {
    key: 'documents',
    label: 'Documents',
    columns: salesOrderDocumentColumns,
    rowDataKey: 'documents',
    emptyText: 'No documents',
  },
  {
    key: 'activity',
    label: 'Activity',
    columns: activityColumns,
    rowDataKey: 'activity',
    emptyText: 'No activity',
  },
];

const salesOrderRecordRows: DynamicRecordListRow[] = salesOrderGridRows.map(
  (row) => {
    const lineRows = orderLineRowsByOrderId[row.id] ?? [];

    return {
      key: row.id,
      cells: { ...row },
      lineRows: lineRows.map((lineRow) => ({ ...lineRow })),
      tabRows: {
        activity: [
          {
            id: `${row.id}-activity-created`,
            time: row.orderDate,
            actor: row.createdBy,
            activity: 'Created sales order',
          },
          {
            id: `${row.id}-activity-updated`,
            time: row.deliveryDate,
            actor: row.updatedBy,
            activity: 'Updated fulfillment plan',
          },
        ],
        documents:
          row.attachment === '0 files'
            ? []
            : [
                {
                  id: `${row.id}-document-1`,
                  document: `${row.orderNo}-commercial.pdf`,
                  type: 'Commercial',
                  uploadedBy: row.updatedBy,
                },
              ],
        payments: (paymentRowsByOrderId[row.id] ?? []).map((paymentRow) => ({
          ...paymentRow,
        })),
      },
    };
  },
);

const inventoryStatusMap: Record<string, DynamicStatusDescriptor> = {
  available: {
    color: 'success',
    label: 'Available',
  },
  low: {
    color: 'warning',
    label: 'Low stock',
  },
  transfer: {
    color: 'processing',
    label: 'In transfer',
  },
};

const financeStatusMap: Record<string, DynamicStatusDescriptor> = {
  cleared: {
    color: 'success',
    label: 'Cleared',
  },
  pending: {
    color: 'warning',
    label: 'Pending',
  },
  review: {
    color: 'processing',
    label: 'Review',
  },
};

const policyStatusMap: Record<string, DynamicStatusDescriptor> = {
  enforced: {
    color: 'success',
    label: 'Enforced',
  },
  scheduled: {
    color: 'processing',
    label: 'Scheduled',
  },
};

const accessPolicyFormFields: DynamicFormFieldSchema[] = [
  {
    fieldName: 'policyName',
    label: 'Policy name',
    type: 'text',
    placeholder: 'e.g. Finance Approver Policy',
    validationRules: {
      required: {
        value: true,
        message: 'Policy name is required',
      },
    },
  },
  {
    fieldName: 'approvalWindowHours',
    label: 'Approval window (hours)',
    type: 'number',
    placeholder: '24',
    defaultValue: 24,
    validationRules: {
      required: {
        value: true,
        message: 'Approval window is required',
      },
      min: {
        value: 1,
        message: 'Approval window must be at least 1 hour',
      },
    },
  },
  {
    fieldName: 'effectiveDate',
    label: 'Effective date',
    type: 'date',
    defaultValue: '2026-05-14',
    validationRules: {
      required: {
        value: true,
        message: 'Effective date is required',
      },
    },
  },
  {
    fieldName: 'defaultRole',
    label: 'Default role',
    type: 'select',
    defaultValue: 'reviewer',
    options: [
      {
        label: 'Reviewer',
        value: 'reviewer',
      },
      {
        label: 'Approver',
        value: 'approver',
      },
      {
        label: 'Admin',
        value: 'admin',
      },
    ],
    validationRules: {
      required: {
        value: true,
        message: 'Default role is required',
      },
    },
  },
];

const employeeRows: DynamicTableRow[] = [
  {
    id: 'emp-1001',
    employee: 'Avery Nguyen',
    department: 'Finance',
    manager: 'Helena Tran',
    status: 'ready',
  },
  {
    id: 'emp-1002',
    employee: 'Minh Le',
    department: 'Operations',
    manager: 'Duc Hoang',
    status: 'review',
  },
  {
    id: 'emp-1003',
    employee: 'Jamie Pham',
    department: 'Procurement',
    manager: 'Nora Vu',
    status: 'blocked',
  },
];

const purchaseOrderRows: DynamicRecordListRow[] = [
  {
    key: 'po-1401',
    cells: {
      id: 'po-1401',
      poNumber: 'PO-1401',
      vendor: 'Northwind Components',
      buyer: 'Linh Tran',
      orderDate: '2026-05-14',
      requiredDate: '2026-05-21',
      value: 48000,
      warehouse: 'HCM Main',
      status: 'pending',
      paymentTerm: 'Net 30',
    },
    lineRows: [
      {
        id: 'po-1401-1',
        item: 'Sensor assembly',
        quantity: 120,
        unitPrice: 260,
        amount: 31200,
      },
      {
        id: 'po-1401-2',
        item: 'Installation kit',
        quantity: 80,
        unitPrice: 210,
        amount: 16800,
      },
    ],
  },
  {
    key: 'po-1402',
    cells: {
      id: 'po-1402',
      poNumber: 'PO-1402',
      vendor: 'Meridian Freight',
      buyer: 'Bao Nguyen',
      orderDate: '2026-05-13',
      requiredDate: '2026-05-18',
      value: 126000,
      warehouse: 'Da Nang DC',
      status: 'approved',
      paymentTerm: 'Net 15',
    },
    lineRows: [
      {
        id: 'po-1402-1',
        item: 'International freight lane',
        quantity: 1,
        unitPrice: 98000,
        amount: 98000,
      },
      {
        id: 'po-1402-2',
        item: 'Customs clearance',
        quantity: 1,
        unitPrice: 28000,
        amount: 28000,
      },
    ],
  },
  {
    key: 'po-1403',
    cells: {
      id: 'po-1403',
      poNumber: 'PO-1403',
      vendor: 'Summit Facilities',
      buyer: 'Minh Le',
      orderDate: '2026-05-12',
      requiredDate: '2026-05-29',
      value: 9100,
      warehouse: 'Hanoi Office',
      status: 'draft',
      paymentTerm: 'Due on receipt',
    },
    lineRows: [
      {
        id: 'po-1403-1',
        item: 'Office maintenance',
        quantity: 7,
        unitPrice: 900,
        amount: 6300,
      },
      {
        id: 'po-1403-2',
        item: 'Safety inspection',
        quantity: 4,
        unitPrice: 700,
        amount: 2800,
      },
    ],
  },
];

const salesOrderRows: DynamicTableRow[] = [
  {
    id: '1000034',
    orderNo: 'SO-00034',
    customer: 'Cong ty TNHH ABC',
    orderDate: '15/05/2025',
    grandTotal: '125,500,000',
    status: 'completed',
    createdBy: 'Nguyen Van A',
  },
  {
    id: '1000033',
    orderNo: 'SO-00033',
    customer: 'Cong ty CP XYZ',
    orderDate: '14/05/2025',
    grandTotal: '82,750,000',
    status: 'processing',
    createdBy: 'Tran Thi B',
  },
  {
    id: '1000032',
    orderNo: 'SO-00032',
    customer: 'Cong ty TNHH MTV DEF',
    orderDate: '13/05/2025',
    grandTotal: '45,200,000',
    status: 'draft',
    createdBy: 'Le Van C',
  },
  {
    id: '1000031',
    orderNo: 'SO-00031',
    customer: 'Cong ty CP GHI',
    orderDate: '12/05/2025',
    grandTotal: '310,000,000',
    status: 'completed',
    createdBy: 'Nguyen Van A',
  },
  {
    id: '1000030',
    orderNo: 'SO-00030',
    customer: 'Cong ty TNHH JKL',
    orderDate: '10/05/2025',
    grandTotal: '67,300,000',
    status: 'cancelled',
    createdBy: 'Tran Thi B',
  },
  {
    id: '1000029',
    orderNo: 'SO-00029',
    customer: 'Cong ty CP MNO',
    orderDate: '09/05/2025',
    grandTotal: '95,000,000',
    status: 'processing',
    createdBy: 'Le Van C',
  },
  {
    id: '1000028',
    orderNo: 'SO-00028',
    customer: 'Cong ty TNHH PQR',
    orderDate: '08/05/2025',
    grandTotal: '150,600,000',
    status: 'completed',
    createdBy: 'Nguyen Van A',
  },
  {
    id: '1000027',
    orderNo: 'SO-00027',
    customer: 'Cong ty CP STU',
    orderDate: '07/05/2025',
    grandTotal: '28,750,000',
    status: 'draft',
    createdBy: 'Tran Thi B',
  },
  {
    id: '1000026',
    orderNo: 'SO-00026',
    customer: 'Cong ty TNHH VWX',
    orderDate: '06/05/2025',
    grandTotal: '53,450,000',
    status: 'completed',
    createdBy: 'Nguyen Van A',
  },
  {
    id: '1000025',
    orderNo: 'SO-00025',
    customer: 'Cong ty CP YZA',
    orderDate: '05/05/2025',
    grandTotal: '120,000,000',
    status: 'processing',
    createdBy: 'Le Van C',
  },
];

const inventoryRows: DynamicTableRow[] = [
  {
    id: 'sku-1001',
    sku: 'FIT-SENSOR-A1',
    location: 'HCM Main',
    quantity: 1240,
    reserved: 260,
    status: 'available',
  },
  {
    id: 'sku-1002',
    sku: 'FIT-KIT-B2',
    location: 'Da Nang DC',
    quantity: 84,
    reserved: 72,
    status: 'low',
  },
  {
    id: 'sku-1003',
    sku: 'FIT-CABLE-C4',
    location: 'Hanoi Office',
    quantity: 430,
    reserved: 120,
    status: 'transfer',
  },
];

const financeRows: DynamicTableRow[] = [
  {
    id: 'fin-301',
    document: 'INV-2026-301',
    counterparty: 'An Phu Retail',
    dueDate: '2026-05-20',
    amount: 73600,
    status: 'pending',
  },
  {
    id: 'fin-302',
    document: 'PAY-2026-188',
    counterparty: 'Northwind Components',
    dueDate: '2026-05-18',
    amount: 48000,
    status: 'review',
  },
  {
    id: 'fin-303',
    document: 'REC-2026-077',
    counterparty: 'Blue Harbor Foods',
    dueDate: '2026-05-14',
    amount: 41800,
    status: 'cleared',
  },
];

const salesInvoiceRows: DynamicTableRow[] = [
  {
    id: 'sinv-4101',
    invoiceNo: 'SI-4101',
    customer: 'An Phu Retail',
    invoiceDate: '2026-05-14',
    amount: 73600,
    status: 'cleared',
  },
  {
    id: 'sinv-4102',
    invoiceNo: 'SI-4102',
    customer: 'Blue Harbor Foods',
    invoiceDate: '2026-05-14',
    amount: 41800,
    status: 'pending',
  },
  {
    id: 'sinv-4103',
    invoiceNo: 'SI-4103',
    customer: 'Metro Clinic Group',
    invoiceDate: '2026-05-13',
    amount: 18500,
    status: 'review',
  },
];

const invoiceColumns: DynamicTableColumn[] = [
  {
    key: 'invoiceNo',
    title: 'Invoice No',
    dataIndex: 'invoiceNo',
  },
  {
    key: 'customer',
    title: 'Customer',
    dataIndex: 'customer',
  },
  {
    key: 'invoiceDate',
    title: 'Invoice Date',
    dataIndex: 'invoiceDate',
  },
  {
    key: 'amount',
    title: 'Amount',
    dataIndex: 'amount',
    align: 'right',
    currency: 'VND',
    presentation: 'currency',
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
    presentation: 'status',
    statusMap: financeStatusMap,
  },
];

const invoiceDetailFields: DynamicRecordDetailField[] = [
  {
    label: 'Invoice No',
    dataIndex: 'invoiceNo',
  },
  {
    label: 'Customer',
    dataIndex: 'customer',
  },
  {
    label: 'Invoice Date',
    dataIndex: 'invoiceDate',
  },
  {
    label: 'Due Date',
    dataIndex: 'dueDate',
  },
  {
    label: 'Source Order',
    dataIndex: 'sourceOrder',
  },
  {
    label: 'Payment Term',
    dataIndex: 'paymentTerm',
  },
  {
    label: 'Amount',
    dataIndex: 'amount',
    currency: 'VND',
    presentation: 'currency',
  },
  {
    label: 'Status',
    dataIndex: 'status',
    presentation: 'status',
    statusMap: financeStatusMap,
  },
];

const invoiceLineColumns: DynamicTableColumn[] = [
  {
    key: 'item',
    title: 'Item',
    dataIndex: 'item',
  },
  {
    key: 'quantity',
    title: 'Qty',
    dataIndex: 'quantity',
    align: 'right',
  },
  {
    key: 'unitPrice',
    title: 'Unit Price',
    dataIndex: 'unitPrice',
    align: 'right',
    currency: 'VND',
    presentation: 'currency',
  },
  {
    key: 'amount',
    title: 'Amount',
    dataIndex: 'amount',
    align: 'right',
    currency: 'VND',
    presentation: 'currency',
  },
];

const invoicePaymentColumns: DynamicTableColumn[] = [
  {
    key: 'paymentNo',
    title: 'Payment No',
    dataIndex: 'paymentNo',
  },
  {
    key: 'dueDate',
    title: 'Due Date',
    dataIndex: 'dueDate',
  },
  {
    key: 'amount',
    title: 'Amount',
    dataIndex: 'amount',
    align: 'right',
    currency: 'VND',
    presentation: 'currency',
  },
  {
    key: 'status',
    title: 'Status',
    dataIndex: 'status',
  },
];

const invoiceDetailTabs: DynamicRecordDetailTab[] = [
  {
    key: 'invoice-lines',
    label: 'Invoice Lines',
    columns: invoiceLineColumns,
    rowDataKey: 'lineRows',
    emptyText: 'No invoice lines',
  },
  {
    key: 'payments',
    label: 'Payment',
    columns: invoicePaymentColumns,
    rowDataKey: 'payments',
    emptyText: 'No payment records',
  },
  {
    key: 'activity',
    label: 'Activity',
    columns: activityColumns,
    rowDataKey: 'activity',
    emptyText: 'No activity',
  },
];

const invoiceRecordRows: DynamicRecordListRow[] = salesInvoiceRows.map(
  (row, index) => {
    const amount = Number(row.amount);
    const sourceOrder = `SO-0003${4 - index}`;

    return {
      key: String(row.id),
      cells: {
        ...row,
        dueDate: `2026-05-${24 - index}`,
        paymentTerm: index === 0 ? 'Net 30' : 'Net 15',
        sourceOrder,
      },
      lineRows: [
        {
          id: `${row.id}-line-1`,
          item: 'Revenue line',
          quantity: 1,
          unitPrice: amount,
          amount,
        },
      ],
      tabRows: {
        activity: [
          {
            id: `${row.id}-activity-issued`,
            time: String(row.invoiceDate),
            actor: 'Billing Team',
            activity: 'Issued invoice',
          },
        ],
        payments: [
          {
            id: `${row.id}-payment-1`,
            paymentNo: `PAY-${4101 + index}`,
            dueDate: `2026-05-${24 - index}`,
            amount,
            status: row.status === 'cleared' ? 'Paid' : 'Open',
          },
        ],
      },
    };
  },
);

const customerRows: DynamicTableRow[] = [
  {
    id: 'cus-1001',
    customer: 'An Phu Retail',
    segment: 'Retail',
    owner: 'Mai Nguyen',
    balance: 73600,
    status: 'ready',
  },
  {
    id: 'cus-1002',
    customer: 'Blue Harbor Foods',
    segment: 'Food service',
    owner: 'Quang Pham',
    balance: 41800,
    status: 'review',
  },
  {
    id: 'cus-1003',
    customer: 'Metro Clinic Group',
    segment: 'Healthcare',
    owner: 'Linh Tran',
    balance: 18500,
    status: 'blocked',
  },
];

const productRows: DynamicTableRow[] = [
  {
    id: 'prd-1001',
    sku: 'FIT-SENSOR-A1',
    product: 'Sensor assembly',
    category: 'Devices',
    price: 260,
    status: 'available',
  },
  {
    id: 'prd-1002',
    sku: 'FIT-KIT-B2',
    product: 'Installation kit',
    category: 'Accessories',
    price: 210,
    status: 'available',
  },
  {
    id: 'prd-1003',
    sku: 'FIT-CABLE-C4',
    product: 'Shielded cable',
    category: 'Components',
    price: 44,
    status: 'low',
  },
];

const priceListRows: DynamicTableRow[] = [
  {
    id: 'pl-std',
    priceList: 'Standard 2026',
    market: 'Vietnam',
    currency: 'USD',
    effectiveDate: '2026-01-01',
    status: 'ready',
  },
  {
    id: 'pl-retail',
    priceList: 'Retail partner',
    market: 'Vietnam',
    currency: 'USD',
    effectiveDate: '2026-04-01',
    status: 'review',
  },
  {
    id: 'pl-export',
    priceList: 'Export lane',
    market: 'APAC',
    currency: 'USD',
    effectiveDate: '2026-05-01',
    status: 'blocked',
  },
];

const purchaseRequestRows: DynamicTableRow[] = [
  {
    id: 'pr-501',
    requestNo: 'PR-501',
    requester: 'Minh Le',
    department: 'Operations',
    neededBy: '2026-05-24',
    status: 'review',
  },
  {
    id: 'pr-502',
    requestNo: 'PR-502',
    requester: 'Bao Nguyen',
    department: 'Logistics',
    neededBy: '2026-05-22',
    status: 'ready',
  },
  {
    id: 'pr-503',
    requestNo: 'PR-503',
    requester: 'Jamie Pham',
    department: 'Procurement',
    neededBy: '2026-05-30',
    status: 'blocked',
  },
];

const vendorRows: DynamicTableRow[] = [
  {
    id: 'ven-1001',
    vendor: 'Northwind Components',
    category: 'Components',
    owner: 'Linh Tran',
    exposure: 48000,
    status: 'ready',
  },
  {
    id: 'ven-1002',
    vendor: 'Meridian Freight',
    category: 'Logistics',
    owner: 'Bao Nguyen',
    exposure: 126000,
    status: 'review',
  },
  {
    id: 'ven-1003',
    vendor: 'Summit Facilities',
    category: 'Services',
    owner: 'Minh Le',
    exposure: 9100,
    status: 'blocked',
  },
];

const stockTransferRows: DynamicTableRow[] = [
  {
    id: 'st-7001',
    transferNo: 'ST-7001',
    fromLocation: 'HCM Main',
    toLocation: 'Da Nang DC',
    quantity: 120,
    status: 'transfer',
  },
  {
    id: 'st-7002',
    transferNo: 'ST-7002',
    fromLocation: 'Da Nang DC',
    toLocation: 'Hanoi Office',
    quantity: 64,
    status: 'available',
  },
  {
    id: 'st-7003',
    transferNo: 'ST-7003',
    fromLocation: 'HCM Main',
    toLocation: 'Hanoi Office',
    quantity: 18,
    status: 'low',
  },
];

export const workspaceNavigation: WorkspaceNavItem[] = [
  {
    key: 'dashboard',
    moduleKey: 'dashboard',
    label: 'Dashboard',
    description: 'KPI and workflow overview',
  },
  {
    key: 'sales',
    label: 'Sales',
    description: 'Sales and customer orders',
    children: [
      {
        key: 'sales-orders',
        moduleKey: 'sales-orders',
        label: 'Sales Order',
        description: 'Customer order list',
      },
      {
        key: 'sales-invoices',
        moduleKey: 'sales-invoices',
        label: 'Sales Invoice',
        description: 'Billing documents',
      },
      {
        key: 'invoices',
        moduleKey: 'invoices',
        label: 'Invoice',
        description: 'Dynamic invoice workspace',
      },
      {
        key: 'customers',
        moduleKey: 'customers',
        label: 'Customers',
        description: 'Customer master data',
      },
      {
        key: 'products',
        moduleKey: 'products',
        label: 'Products',
        description: 'Sellable catalog',
      },
      {
        key: 'price-list',
        moduleKey: 'price-list',
        label: 'Price List',
        description: 'Pricing tables',
      },
    ],
  },
  {
    key: 'purchase',
    label: 'Purchase',
    description: 'Buying and approvals',
    children: [
      {
        key: 'purchase-orders',
        moduleKey: 'purchase-orders',
        label: 'Purchase Orders',
        description: 'Request queues and approval routing',
      },
      {
        key: 'purchase-request',
        moduleKey: 'purchase-requests',
        label: 'Purchase Request',
        description: 'Internal demand intake',
      },
      {
        key: 'vendors',
        moduleKey: 'vendors',
        label: 'Vendors',
        description: 'Supplier master data',
      },
    ],
  },
  {
    key: 'warehouse',
    label: 'Warehouse',
    description: 'Stock and movement',
    children: [
      {
        key: 'inventory-overview',
        moduleKey: 'warehouse',
        label: 'Inventory',
        description: 'Stock balance table',
      },
      {
        key: 'stock-transfer',
        moduleKey: 'stock-transfers',
        label: 'Stock Transfer',
        description: 'Inventory movement',
      },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    description: 'Receivable and payable',
    children: [
      {
        key: 'finance-overview',
        moduleKey: 'finance',
        label: 'Finance Overview',
        description: 'Cash and document status',
      },
      {
        key: 'invoices',
        moduleKey: 'finance-invoices',
        label: 'Invoices',
        description: 'AR and AP invoice queue',
      },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    description: 'Master data and governance',
    children: [
      {
        key: 'employees',
        moduleKey: 'employees',
        label: 'Employees',
        description: 'Master data, onboarding, and org changes',
      },
      {
        key: 'access-control',
        moduleKey: 'access-control',
        label: 'Access Control',
        description: 'Permission baselines and review policies',
      },
    ],
  },
];

interface TableModuleConfig {
  badge: string;
  columns: DynamicTableColumn[];
  createLabel: string;
  moduleKey: WorkspaceModuleKey;
  rows: DynamicTableRow[];
  subtitle: string;
  tableTitle: string;
  title: string;
}

const createTableModule = ({
  badge,
  columns,
  createLabel,
  moduleKey,
  rows,
  subtitle,
  tableTitle,
  title,
}: TableModuleConfig): WorkspaceModuleSchema => ({
  badge,
  moduleKey,
  title,
  subtitle,
  sections: [
    {
      id: `${moduleKey}-stats`,
      type: 'stats',
      title: `${title} signals`,
      items: [
        {
          label: 'Open records',
          value: String(rows.length * 8 + 4),
          helper: 'Synced from workspace metadata',
          tone: 'neutral',
        },
        {
          label: 'Ready',
          value: String(Math.max(1, rows.length * 3)),
          helper: 'Available for workflow actions',
          tone: 'positive',
        },
        {
          label: 'Needs review',
          value: String(Math.max(1, rows.length)),
          helper: 'Waiting on owner validation',
          tone: 'warning',
        },
        {
          label: 'Updated today',
          value: String(Math.max(1, rows.length + 2)),
          helper: 'Changed in the current cycle',
          tone: 'positive',
        },
      ],
    },
    {
      id: `${moduleKey}-table`,
      type: 'table',
      title: tableTitle,
      createLabel,
      rowKeyField: 'id',
      columns,
      rows,
    },
  ],
});

const workspaceModules: Record<WorkspaceModuleKey, WorkspaceModuleSchema> = {
  dashboard: {
    badge: 'Operations workspace',
    moduleKey: 'dashboard',
    title: 'Operations command center',
    subtitle: 'A single shell for ERP modules backed by metadata-driven UI.',
    sections: [
      {
        id: 'dashboard-hero',
        type: 'hero',
        eyebrow: 'Realtime visibility',
        title: 'Run Finance, People, and Procurement from one shell.',
        description:
          'This workspace keeps authentication, navigation, and content rendering separate. The shell stays stable while the page internals change by metadata.',
      },
      {
        id: 'dashboard-stats',
        type: 'stats',
        title: 'Today at a glance',
        description:
          'Representative KPIs for the app shell. In production these values would come from server state.',
        items: [
          {
            label: 'Pending approvals',
            value: '18',
            helper: '+4 vs yesterday',
            tone: 'warning',
          },
          {
            label: 'Open onboarding tasks',
            value: '27',
            helper: '92% on SLA',
            tone: 'positive',
          },
          {
            label: 'Policy drifts',
            value: '3',
            helper: '1 critical path item',
            tone: 'warning',
          },
          {
            label: 'Procurement exposure',
            value: '$182k',
            helper: 'Within monthly target',
            tone: 'neutral',
          },
        ],
      },
      {
        id: 'dashboard-table',
        type: 'table',
        title: 'Escalated workflows',
        createLabel: 'New',
        description:
          'A metadata-driven table section inside the shell content area.',
        rowKeyField: 'id',
        columns: [
          {
            key: 'workflow',
            title: 'Workflow',
            dataIndex: 'workflow',
          },
          {
            key: 'owner',
            title: 'Owner',
            dataIndex: 'owner',
          },
          {
            key: 'age',
            title: 'Age',
            dataIndex: 'age',
            align: 'right',
          },
          {
            key: 'status',
            title: 'Status',
            dataIndex: 'status',
            presentation: 'status',
            statusMap: approvalStatusMap,
          },
        ],
        rows: [
          {
            id: 'wf-1',
            workflow: 'New supplier due diligence',
            owner: 'Procurement',
            age: '19h',
            status: 'review',
          },
          {
            id: 'wf-2',
            workflow: 'Headcount budget release',
            owner: 'Finance',
            age: '27h',
            status: 'blocked',
          },
          {
            id: 'wf-3',
            workflow: 'Quarterly access re-certification',
            owner: 'IT Governance',
            age: '4h',
            status: 'ready',
          },
        ],
      },
    ],
  },
  'sales-orders': {
    badge: 'Sales',
    moduleKey: 'sales-orders',
    title: 'Sales Order',
    subtitle: 'Dynamic grid tab master-detail view generated from API metadata.',
    sections: [
      {
        id: 'sales-orders-record-list',
        type: 'record-list',
        title: 'Sales Order',
        description:
          'Columns, detail fields, tabs, and row content are supplied by workspace metadata.',
        createLabel: 'New sales order',
        defaultActions: {
          attachFile: {
            label: 'Attach file',
            visible: true,
          },
          create: {
            label: 'New sales order',
            visible: true,
          },
          exportExcel: {
            label: 'Export Excel',
            visible: true,
          },
          importExcel: {
            label: 'Import Excel',
            visible: true,
          },
        },
        emptyRecordTitle: 'New sales order',
        fieldActions: [
          {
            key: 'email-customer',
            label: 'Email customer',
            icon: 'mail',
            requiresSelection: true,
            scope: 'both',
            targetField: 'customer',
          },
          {
            key: 'print-sales-order',
            label: 'Print SO',
            icon: 'print',
            requiresSelection: true,
            scope: 'detail',
          },
        ],
        toolbarActions: [
          {
            key: 'confirm-selected',
            label: 'Confirm',
            icon: 'approve',
            requiresSelection: true,
            scope: 'list',
            tone: 'primary',
          },
          {
            key: 'refresh-list',
            label: 'Refresh',
            icon: 'refresh',
            scope: 'both',
          },
        ],
        columns: salesOrderColumns,
        detailFields: salesOrderDetailFields,
        detailTabs: salesOrderDetailTabs,
        lineColumns: salesOrderLineColumns,
        rows: salesOrderRecordRows,
      },
    ],
  },
  'sales-invoices': {
    badge: 'Sales',
    moduleKey: 'sales-invoices',
    title: 'Sales invoice workspace',
    subtitle: 'Issued invoices, payment status, and customer billing review.',
    sections: [
      {
        id: 'sales-invoices-record-list',
        type: 'record-list',
        title: 'Sales invoices',
        description:
          'The invoice screen reuses the same dynamic grid tab master-detail renderer.',
        createLabel: 'New invoice',
        emptyRecordTitle: 'New invoice',
        toolbarActions: [
          {
            key: 'send-invoice',
            label: 'Send invoice',
            icon: 'send',
            requiresSelection: true,
            scope: 'both',
            tone: 'primary',
          },
          {
            key: 'refresh-invoices',
            label: 'Refresh',
            icon: 'refresh',
            scope: 'both',
          },
        ],
        columns: invoiceColumns,
        detailFields: invoiceDetailFields,
        detailTabs: invoiceDetailTabs,
        lineColumns: invoiceLineColumns,
        rows: invoiceRecordRows,
      },
    ],
  },
  invoices: {
    badge: 'Sales',
    moduleKey: 'invoices',
    title: 'Invoice',
    subtitle: 'Dynamic invoice workspace generated from metadata.',
    sections: [
      {
        id: 'invoices-record-list',
        type: 'record-list',
        title: 'Invoice',
        description:
          'Shared metadata-driven list, detail fields, and tab grids.',
        createLabel: 'New invoice',
        emptyRecordTitle: 'New invoice',
        toolbarActions: [
          {
            key: 'send-invoice',
            label: 'Send invoice',
            icon: 'send',
            requiresSelection: true,
            scope: 'both',
            tone: 'primary',
          },
          {
            key: 'refresh-invoices',
            label: 'Refresh',
            icon: 'refresh',
            scope: 'both',
          },
        ],
        columns: invoiceColumns,
        detailFields: invoiceDetailFields,
        detailTabs: invoiceDetailTabs,
        lineColumns: invoiceLineColumns,
        rows: invoiceRecordRows,
      },
    ],
  },
  customers: createTableModule({
    badge: 'Sales',
    moduleKey: 'customers',
    title: 'Customer master data',
    subtitle: 'Accounts, owners, balances, and onboarding state.',
    tableTitle: 'Customers',
    createLabel: 'New customer',
    columns: [
      {
        key: 'customer',
        title: 'Customer',
        dataIndex: 'customer',
      },
      {
        key: 'segment',
        title: 'Segment',
        dataIndex: 'segment',
      },
      {
        key: 'owner',
        title: 'Owner',
        dataIndex: 'owner',
      },
      {
        key: 'balance',
        title: 'Balance',
        dataIndex: 'balance',
        align: 'right',
        presentation: 'currency',
      },
      {
        key: 'status',
        title: 'State',
        dataIndex: 'status',
        presentation: 'status',
        statusMap: approvalStatusMap,
      },
    ],
    rows: customerRows,
  }),
  products: createTableModule({
    badge: 'Sales',
    moduleKey: 'products',
    title: 'Product catalog',
    subtitle: 'Sellable items, categories, prices, and availability.',
    tableTitle: 'Products',
    createLabel: 'New product',
    columns: [
      {
        key: 'sku',
        title: 'SKU',
        dataIndex: 'sku',
      },
      {
        key: 'product',
        title: 'Product',
        dataIndex: 'product',
      },
      {
        key: 'category',
        title: 'Category',
        dataIndex: 'category',
      },
      {
        key: 'price',
        title: 'Price',
        dataIndex: 'price',
        align: 'right',
        presentation: 'currency',
      },
      {
        key: 'status',
        title: 'Stock state',
        dataIndex: 'status',
        presentation: 'status',
        statusMap: inventoryStatusMap,
      },
    ],
    rows: productRows,
  }),
  'price-list': createTableModule({
    badge: 'Sales',
    moduleKey: 'price-list',
    title: 'Price list management',
    subtitle: 'Pricing tables, markets, currencies, and effective dates.',
    tableTitle: 'Price lists',
    createLabel: 'New price list',
    columns: [
      {
        key: 'priceList',
        title: 'Price list',
        dataIndex: 'priceList',
      },
      {
        key: 'market',
        title: 'Market',
        dataIndex: 'market',
      },
      {
        key: 'currency',
        title: 'Currency',
        dataIndex: 'currency',
      },
      {
        key: 'effectiveDate',
        title: 'Effective date',
        dataIndex: 'effectiveDate',
      },
      {
        key: 'status',
        title: 'State',
        dataIndex: 'status',
        presentation: 'status',
        statusMap: approvalStatusMap,
      },
    ],
    rows: priceListRows,
  }),
  warehouse: {
    badge: 'Warehouse',
    moduleKey: 'warehouse',
    title: 'Warehouse inventory',
    subtitle: 'Stock visibility, reservations, and transfer state.',
    sections: [
      {
        id: 'warehouse-stats',
        type: 'stats',
        title: 'Stock signals',
        items: [
          {
            label: 'Active SKUs',
            value: '1,284',
            helper: 'Across 3 locations',
            tone: 'neutral',
          },
          {
            label: 'Low stock items',
            value: '14',
            helper: '5 below reorder point',
            tone: 'warning',
          },
          {
            label: 'In transfer',
            value: '9',
            helper: 'No transfer over SLA',
            tone: 'positive',
          },
          {
            label: 'Reserved units',
            value: '452',
            helper: 'Allocated to sales orders',
            tone: 'neutral',
          },
        ],
      },
      {
        id: 'warehouse-table',
        type: 'table',
        title: 'Inventory balance',
        createLabel: 'New stock item',
        rowKeyField: 'id',
        columns: [
          {
            key: 'sku',
            title: 'SKU',
            dataIndex: 'sku',
          },
          {
            key: 'location',
            title: 'Location',
            dataIndex: 'location',
          },
          {
            key: 'quantity',
            title: 'Quantity',
            dataIndex: 'quantity',
            align: 'right',
          },
          {
            key: 'reserved',
            title: 'Reserved',
            dataIndex: 'reserved',
            align: 'right',
          },
          {
            key: 'status',
            title: 'Status',
            dataIndex: 'status',
            presentation: 'status',
            statusMap: inventoryStatusMap,
          },
        ],
        rows: inventoryRows,
      },
    ],
  },
  finance: {
    badge: 'Finance',
    moduleKey: 'finance',
    title: 'Finance overview',
    subtitle: 'Receivable, payable, and document settlement state.',
    sections: [
      {
        id: 'finance-stats',
        type: 'stats',
        title: 'Finance signals',
        items: [
          {
            label: 'Pending documents',
            value: '21',
            helper: '4 due this week',
            tone: 'warning',
          },
          {
            label: 'Cleared today',
            value: '$42k',
            helper: '3 receipts posted',
            tone: 'positive',
          },
          {
            label: 'Payment reviews',
            value: '5',
            helper: 'Waiting on approvers',
            tone: 'warning',
          },
          {
            label: 'Open exposure',
            value: '$162k',
            helper: 'Within treasury limit',
            tone: 'neutral',
          },
        ],
      },
      {
        id: 'finance-table',
        type: 'table',
        title: 'Finance documents',
        createLabel: 'New document',
        rowKeyField: 'id',
        columns: [
          {
            key: 'document',
            title: 'Document',
            dataIndex: 'document',
          },
          {
            key: 'counterparty',
            title: 'Counterparty',
            dataIndex: 'counterparty',
          },
          {
            key: 'dueDate',
            title: 'Due date',
            dataIndex: 'dueDate',
          },
          {
            key: 'amount',
            title: 'Amount',
            dataIndex: 'amount',
            align: 'right',
            presentation: 'currency',
          },
          {
            key: 'status',
            title: 'Status',
            dataIndex: 'status',
            presentation: 'status',
            statusMap: financeStatusMap,
          },
        ],
        rows: financeRows,
      },
    ],
  },
  employees: {
    badge: 'People operations',
    moduleKey: 'employees',
    title: 'Employee master data',
    subtitle: 'Directory records, onboarding input, and approval readiness.',
    sections: [
      {
        id: 'employees-hero',
        type: 'hero',
        eyebrow: 'People data',
        title: 'Metadata controls the employee form and roster table.',
        description:
          'The same shell can render form-heavy modules without changing the layout contract. Backend metadata only changes the content payload.',
      },
      {
        id: 'employees-stats',
        type: 'stats',
        title: 'Headcount status',
        items: [
          {
            label: 'Active employees',
            value: '214',
            helper: '+6 this month',
            tone: 'positive',
          },
          {
            label: 'Onboarding pipeline',
            value: '12',
            helper: '4 waiting on legal docs',
            tone: 'warning',
          },
          {
            label: 'Manager approvals',
            value: '9',
            helper: 'No blocker over 24h',
            tone: 'neutral',
          },
          {
            label: 'Org changes queued',
            value: '7',
            helper: '2 need HRBP review',
            tone: 'warning',
          },
        ],
      },
      {
        id: 'employees-table',
        type: 'table',
        title: 'Roster sample',
        createLabel: 'New employee',
        rowKeyField: 'id',
        columns: [
          {
            key: 'employee',
            title: 'Employee',
            dataIndex: 'employee',
          },
          {
            key: 'department',
            title: 'Department',
            dataIndex: 'department',
          },
          {
            key: 'manager',
            title: 'Manager',
            dataIndex: 'manager',
          },
          {
            key: 'status',
            title: 'Profile state',
            dataIndex: 'status',
            presentation: 'status',
            statusMap: approvalStatusMap,
          },
        ],
        rows: employeeRows,
      },
      {
        id: 'employees-form',
        type: 'form',
        title: 'User onboarding form',
        description:
          'This form is still fully metadata-driven. The shell only decides where it appears.',
        formId: 'employee-onboarding',
        submitLabel: 'Save employee profile',
        successMessage: 'Employee profile saved from metadata.',
        snapshotTitle: 'Last employee payload',
        fields: userFormMetadataResponse.fields,
      },
    ],
  },
  'purchase-orders': {
    badge: 'Procurement',
    moduleKey: 'purchase-orders',
    title: 'Purchase order approvals',
    subtitle: 'Queue health, exposure, and routing policies.',
    sections: [
      {
        id: 'po-list',
        type: 'record-list',
        title: 'Open purchase orders',
        description:
          'List, header fields, and order lines follow a compact ERP layout.',
        createLabel: 'New purchase order',
        defaultActions: {
          attachFile: {
            label: 'Attach file',
            visible: true,
          },
          create: {
            label: 'New purchase order',
            visible: true,
          },
          exportExcel: {
            label: 'Export Excel',
            visible: true,
          },
          importExcel: {
            label: 'Import Excel',
            visible: true,
          },
        },
        emptyRecordTitle: 'New purchase order',
        fieldActions: [
          {
            key: 'email-vendor',
            label: 'Email vendor',
            icon: 'mail',
            requiresSelection: true,
            scope: 'both',
            targetField: 'vendor',
          },
          {
            key: 'send-to-approver',
            label: 'Send approval',
            icon: 'send',
            requiresSelection: true,
            scope: 'both',
            targetField: 'buyer',
            tone: 'primary',
          },
          {
            key: 'print-po',
            label: 'Print PO',
            icon: 'print',
            requiresSelection: true,
            scope: 'detail',
          },
        ],
        toolbarActions: [
          {
            key: 'approve-selected',
            label: 'Approve',
            icon: 'approve',
            requiresSelection: true,
            scope: 'list',
            tone: 'primary',
          },
          {
            key: 'refresh-list',
            label: 'Refresh',
            icon: 'refresh',
            scope: 'both',
          },
        ],
        columns: [
          {
            key: 'poNumber',
            title: 'PO Number',
            dataIndex: 'poNumber',
          },
          {
            key: 'vendor',
            title: 'Vendor',
            dataIndex: 'vendor',
          },
          {
            key: 'value',
            title: 'Value',
            dataIndex: 'value',
            align: 'right',
            presentation: 'currency',
          },
          {
            key: 'status',
            title: 'Status',
            dataIndex: 'status',
            presentation: 'status',
            statusMap: poStatusMap,
          },
        ],
        detailFields: [
          {
            label: 'PO Number',
            dataIndex: 'poNumber',
          },
          {
            label: 'Vendor',
            dataIndex: 'vendor',
          },
          {
            label: 'Buyer',
            dataIndex: 'buyer',
          },
          {
            label: 'Order date',
            dataIndex: 'orderDate',
          },
          {
            label: 'Required date',
            dataIndex: 'requiredDate',
          },
          {
            label: 'Warehouse',
            dataIndex: 'warehouse',
          },
          {
            label: 'Payment term',
            dataIndex: 'paymentTerm',
          },
          {
            label: 'Total',
            dataIndex: 'value',
            presentation: 'currency',
          },
          {
            label: 'Status',
            dataIndex: 'status',
            presentation: 'status',
            statusMap: poStatusMap,
          },
        ],
        lineColumns: [
          {
            key: 'item',
            title: 'Product',
            dataIndex: 'item',
          },
          {
            key: 'quantity',
            title: 'Qty',
            dataIndex: 'quantity',
            align: 'right',
          },
          {
            key: 'unitPrice',
            title: 'Unit price',
            dataIndex: 'unitPrice',
            align: 'right',
            presentation: 'currency',
          },
          {
            key: 'amount',
            title: 'Amount',
            dataIndex: 'amount',
            align: 'right',
            presentation: 'currency',
          },
        ],
        rows: purchaseOrderRows,
      },
    ],
  },
  'purchase-requests': createTableModule({
    badge: 'Procurement',
    moduleKey: 'purchase-requests',
    title: 'Purchase request intake',
    subtitle: 'Internal demand requests before purchase order conversion.',
    tableTitle: 'Purchase requests',
    createLabel: 'New request',
    columns: [
      {
        key: 'requestNo',
        title: 'Request No',
        dataIndex: 'requestNo',
      },
      {
        key: 'requester',
        title: 'Requester',
        dataIndex: 'requester',
      },
      {
        key: 'department',
        title: 'Department',
        dataIndex: 'department',
      },
      {
        key: 'neededBy',
        title: 'Needed by',
        dataIndex: 'neededBy',
      },
      {
        key: 'status',
        title: 'State',
        dataIndex: 'status',
        presentation: 'status',
        statusMap: approvalStatusMap,
      },
    ],
    rows: purchaseRequestRows,
  }),
  vendors: createTableModule({
    badge: 'Procurement',
    moduleKey: 'vendors',
    title: 'Vendor master data',
    subtitle: 'Supplier ownership, categories, exposure, and review state.',
    tableTitle: 'Vendors',
    createLabel: 'New vendor',
    columns: [
      {
        key: 'vendor',
        title: 'Vendor',
        dataIndex: 'vendor',
      },
      {
        key: 'category',
        title: 'Category',
        dataIndex: 'category',
      },
      {
        key: 'owner',
        title: 'Owner',
        dataIndex: 'owner',
      },
      {
        key: 'exposure',
        title: 'Exposure',
        dataIndex: 'exposure',
        align: 'right',
        presentation: 'currency',
      },
      {
        key: 'status',
        title: 'State',
        dataIndex: 'status',
        presentation: 'status',
        statusMap: approvalStatusMap,
      },
    ],
    rows: vendorRows,
  }),
  'stock-transfers': createTableModule({
    badge: 'Warehouse',
    moduleKey: 'stock-transfers',
    title: 'Stock transfer workspace',
    subtitle: 'Warehouse-to-warehouse inventory movement and quantity state.',
    tableTitle: 'Stock transfers',
    createLabel: 'New transfer',
    columns: [
      {
        key: 'transferNo',
        title: 'Transfer No',
        dataIndex: 'transferNo',
      },
      {
        key: 'fromLocation',
        title: 'From',
        dataIndex: 'fromLocation',
      },
      {
        key: 'toLocation',
        title: 'To',
        dataIndex: 'toLocation',
      },
      {
        key: 'quantity',
        title: 'Quantity',
        dataIndex: 'quantity',
        align: 'right',
      },
      {
        key: 'status',
        title: 'State',
        dataIndex: 'status',
        presentation: 'status',
        statusMap: inventoryStatusMap,
      },
    ],
    rows: stockTransferRows,
  }),
  'finance-invoices': createTableModule({
    badge: 'Finance',
    moduleKey: 'finance-invoices',
    title: 'Invoice queue',
    subtitle: 'Receivable and payable invoices awaiting settlement.',
    tableTitle: 'Invoices',
    createLabel: 'New invoice',
    columns: [
      {
        key: 'document',
        title: 'Document',
        dataIndex: 'document',
      },
      {
        key: 'counterparty',
        title: 'Counterparty',
        dataIndex: 'counterparty',
      },
      {
        key: 'dueDate',
        title: 'Due date',
        dataIndex: 'dueDate',
      },
      {
        key: 'amount',
        title: 'Amount',
        dataIndex: 'amount',
        align: 'right',
        presentation: 'currency',
      },
      {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        presentation: 'status',
        statusMap: financeStatusMap,
      },
    ],
    rows: financeRows,
  }),
  'access-control': {
    badge: 'Governance',
    moduleKey: 'access-control',
    title: 'Access policies',
    subtitle: 'Role baselines, review windows, and enforcement state.',
    sections: [
      {
        id: 'access-hero',
        type: 'hero',
        eyebrow: 'Permission governance',
        title: 'Define policy metadata and let the renderer do the rest.',
        description:
          'Access Control uses the same shell and the same dynamic renderer pattern as onboarding and purchasing.',
      },
      {
        id: 'access-stats',
        type: 'stats',
        title: 'Control signals',
        items: [
          {
            label: 'Policies enforced',
            value: '14',
            helper: 'No failed syncs',
            tone: 'positive',
          },
          {
            label: 'Reviews due',
            value: '5',
            helper: '2 due within 48h',
            tone: 'warning',
          },
          {
            label: 'Privilege drifts',
            value: '1',
            helper: 'Finance elevated role',
            tone: 'warning',
          },
          {
            label: 'Exceptions open',
            value: '3',
            helper: 'Within SLA',
            tone: 'neutral',
          },
        ],
      },
      {
        id: 'access-table',
        type: 'table',
        title: 'Current policies',
        createLabel: 'New policy',
        rowKeyField: 'id',
        columns: [
          {
            key: 'policyName',
            title: 'Policy',
            dataIndex: 'policyName',
          },
          {
            key: 'scope',
            title: 'Scope',
            dataIndex: 'scope',
          },
          {
            key: 'window',
            title: 'Review window',
            dataIndex: 'window',
          },
          {
            key: 'status',
            title: 'State',
            dataIndex: 'status',
            presentation: 'status',
            statusMap: policyStatusMap,
          },
        ],
        rows: [
          {
            id: 'policy-1',
            policyName: 'Finance approver baseline',
            scope: 'Finance',
            window: '24h',
            status: 'enforced',
          },
          {
            id: 'policy-2',
            policyName: 'Procurement emergency override',
            scope: 'Procurement',
            window: '12h',
            status: 'scheduled',
          },
        ],
      },
      {
        id: 'access-form',
        type: 'form',
        title: 'Policy editor',
        description:
          'This shows a second dynamic form configuration inside the same shell.',
        formId: 'access-policy',
        submitLabel: 'Publish policy',
        successMessage: 'Access policy published from metadata.',
        snapshotTitle: 'Latest policy payload',
        fields: accessPolicyFormFields,
      },
    ],
  },
};

export const getWorkspaceModule = (
  moduleKey: WorkspaceModuleKey,
): WorkspaceModuleSchema => {
  return workspaceModules[moduleKey];
};

export const workspaceModuleList: DynamicPageSchema[] =
  Object.values(workspaceModules);
