export type SalesOrderStatus =
  | 'completed'
  | 'processing'
  | 'draft'
  | 'cancelled';

export interface GridColumnConfig<ColumnKey extends string = string> {
  key: ColumnKey;
  label: string;
  align?: 'left' | 'right' | 'center';
  minWidth?: number;
}

type SalesOrderColumnKey =
  | 'id'
  | 'orderNo'
  | 'customer'
  | 'orderDate'
  | 'grandTotal'
  | 'status'
  | 'createdBy'
  | 'updatedBy'
  | 'approvedBy'
  | 'currency'
  | 'paymentTerm'
  | 'deliveryDate'
  | 'warehouse'
  | 'salesRepresentative'
  | 'description'
  | 'attachment'
  | 'note';

interface SalesOrderRow {
  id: string;
  orderNo: string;
  customer: string;
  orderDate: string;
  grandTotal: number;
  status: SalesOrderStatus;
  createdBy: string;
  updatedBy: string;
  approvedBy: string;
  currency: string;
  paymentTerm: string;
  deliveryDate: string;
  warehouse: string;
  salesRepresentative: string;
  description: string;
  attachment: string;
  note: string;
}

type SalesOrderColumnConfig = GridColumnConfig<SalesOrderColumnKey>;

interface SalesOrderFilterValues {
  orderNo: string;
  customer?: string;
  orderDateFrom?: string;
  orderDateTo?: string;
  status?: SalesOrderStatus;
  createdBy?: string;
  grandTotalFrom?: number;
  grandTotalTo?: number;
}

type SalesOrderLineColumnKey =
  | 'lineNo'
  | 'product'
  | 'description'
  | 'uom'
  | 'quantity'
  | 'unitPrice'
  | 'discountPercent'
  | 'taxPercent'
  | 'amount'
  | 'warehouse'
  | 'deliveryDate';

interface SalesOrderLineRow {
  id: string;
  lineNo: number;
  product: string;
  description: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
  warehouse: string;
  deliveryDate: string;
}

type SalesOrderLineColumnConfig = GridColumnConfig<SalesOrderLineColumnKey>;

type SalesOrderPaymentColumnKey =
  | 'paymentNo'
  | 'method'
  | 'dueDate'
  | 'expectedAmount'
  | 'paidAmount'
  | 'status'
  | 'reference';

interface SalesOrderPaymentRow {
  id: string;
  paymentNo: string;
  method: string;
  dueDate: string;
  expectedAmount: number;
  paidAmount: number;
  status: string;
  reference: string;
}

type SalesOrderPaymentColumnConfig =
  GridColumnConfig<SalesOrderPaymentColumnKey>;

export const defaultSalesOrderFilters: SalesOrderFilterValues = {
  orderNo: '',
};

export const defaultVisibleColumns: SalesOrderColumnConfig[] = [
  { key: 'id', label: 'ID', minWidth: 112 },
  { key: 'orderNo', label: 'Order No', minWidth: 136 },
  { key: 'customer', label: 'Customer', minWidth: 220 },
  { key: 'orderDate', label: 'Order Date', minWidth: 132 },
  { key: 'grandTotal', label: 'Grand Total', align: 'right', minWidth: 148 },
  { key: 'status', label: 'Status', minWidth: 132 },
  { key: 'createdBy', label: 'Created By', minWidth: 148 },
];

export const defaultHiddenColumns: SalesOrderColumnConfig[] = [
  { key: 'updatedBy', label: 'Updated By', minWidth: 148 },
  { key: 'approvedBy', label: 'Approved By', minWidth: 148 },
  { key: 'currency', label: 'Currency', minWidth: 112 },
  { key: 'paymentTerm', label: 'Payment Term', minWidth: 152 },
  { key: 'deliveryDate', label: 'Delivery Date', minWidth: 140 },
  { key: 'warehouse', label: 'Warehouse', minWidth: 164 },
  { key: 'salesRepresentative', label: 'Sales Representative', minWidth: 196 },
  { key: 'description', label: 'Description', minWidth: 220 },
  { key: 'attachment', label: 'Attachment', minWidth: 132 },
  { key: 'note', label: 'Note', minWidth: 180 },
];

export const salesOrderRows: SalesOrderRow[] = [
  {
    id: '1000034',
    orderNo: 'SO-00034',
    customer: 'Cong ty TNHH ABC',
    orderDate: '2026-05-15',
    grandTotal: 125500000,
    status: 'completed',
    createdBy: 'Nguyen Van A',
    updatedBy: 'Pham Minh K',
    approvedBy: 'Hoang Lan',
    currency: 'VND',
    paymentTerm: 'Net 30',
    deliveryDate: '2026-05-21',
    warehouse: 'HCM Main',
    salesRepresentative: 'Mai Nguyen',
    description: 'Monthly replenishment order',
    attachment: '2 files',
    note: 'Priority customer',
  },
  {
    id: '1000033',
    orderNo: 'SO-00033',
    customer: 'Cong ty CP XYZ',
    orderDate: '2026-05-14',
    grandTotal: 82750000,
    status: 'processing',
    createdBy: 'Tran Thi B',
    updatedBy: 'Nguyen Van A',
    approvedBy: 'Dang Quang',
    currency: 'VND',
    paymentTerm: 'Net 15',
    deliveryDate: '2026-05-19',
    warehouse: 'Da Nang DC',
    salesRepresentative: 'Linh Tran',
    description: 'Split delivery requested',
    attachment: '1 file',
    note: 'Call before delivery',
  },
  {
    id: '1000032',
    orderNo: 'SO-00032',
    customer: 'Cong ty TNHH MTV DEF',
    orderDate: '2026-05-13',
    grandTotal: 45200000,
    status: 'draft',
    createdBy: 'Le Van C',
    updatedBy: 'Le Van C',
    approvedBy: '-',
    currency: 'VND',
    paymentTerm: 'Due on receipt',
    deliveryDate: '2026-05-18',
    warehouse: 'Hanoi Office',
    salesRepresentative: 'Bao Nguyen',
    description: 'Awaiting customer confirmation',
    attachment: '0 files',
    note: '-',
  },
  {
    id: '1000031',
    orderNo: 'SO-00031',
    customer: 'Cong ty CP GHI',
    orderDate: '2026-05-12',
    grandTotal: 310000000,
    status: 'completed',
    createdBy: 'Nguyen Van A',
    updatedBy: 'Tran Thi B',
    approvedBy: 'Hoang Lan',
    currency: 'VND',
    paymentTerm: 'Net 45',
    deliveryDate: '2026-05-20',
    warehouse: 'HCM Main',
    salesRepresentative: 'Mai Nguyen',
    description: 'Large seasonal order',
    attachment: '4 files',
    note: 'Finance approved',
  },
  {
    id: '1000030',
    orderNo: 'SO-00030',
    customer: 'Cong ty TNHH JKL',
    orderDate: '2026-05-10',
    grandTotal: 67300000,
    status: 'cancelled',
    createdBy: 'Tran Thi B',
    updatedBy: 'Tran Thi B',
    approvedBy: '-',
    currency: 'VND',
    paymentTerm: 'Net 30',
    deliveryDate: '2026-05-17',
    warehouse: 'HCM Main',
    salesRepresentative: 'Linh Tran',
    description: 'Customer cancelled order',
    attachment: '1 file',
    note: 'Reopen only by request',
  },
  {
    id: '1000029',
    orderNo: 'SO-00029',
    customer: 'Cong ty CP MNO',
    orderDate: '2026-05-09',
    grandTotal: 95000000,
    status: 'processing',
    createdBy: 'Le Van C',
    updatedBy: 'Pham Minh K',
    approvedBy: 'Dang Quang',
    currency: 'VND',
    paymentTerm: 'Net 30',
    deliveryDate: '2026-05-16',
    warehouse: 'Da Nang DC',
    salesRepresentative: 'Bao Nguyen',
    description: 'Standard sales order',
    attachment: '2 files',
    note: '-',
  },
  {
    id: '1000028',
    orderNo: 'SO-00028',
    customer: 'Cong ty TNHH PQR',
    orderDate: '2026-05-08',
    grandTotal: 150600000,
    status: 'completed',
    createdBy: 'Nguyen Van A',
    updatedBy: 'Nguyen Van A',
    approvedBy: 'Hoang Lan',
    currency: 'VND',
    paymentTerm: 'Net 15',
    deliveryDate: '2026-05-14',
    warehouse: 'HCM Main',
    salesRepresentative: 'Mai Nguyen',
    description: 'Delivered to warehouse gate',
    attachment: '3 files',
    note: 'Signed POD received',
  },
  {
    id: '1000027',
    orderNo: 'SO-00027',
    customer: 'Cong ty CP STU',
    orderDate: '2026-05-07',
    grandTotal: 28750000,
    status: 'draft',
    createdBy: 'Tran Thi B',
    updatedBy: 'Tran Thi B',
    approvedBy: '-',
    currency: 'VND',
    paymentTerm: 'Due on receipt',
    deliveryDate: '2026-05-15',
    warehouse: 'Hanoi Office',
    salesRepresentative: 'Linh Tran',
    description: 'Pricing validation pending',
    attachment: '0 files',
    note: 'Check credit limit',
  },
  {
    id: '1000026',
    orderNo: 'SO-00026',
    customer: 'Cong ty TNHH VWX',
    orderDate: '2026-05-06',
    grandTotal: 53450000,
    status: 'completed',
    createdBy: 'Nguyen Van A',
    updatedBy: 'Pham Minh K',
    approvedBy: 'Dang Quang',
    currency: 'VND',
    paymentTerm: 'Net 30',
    deliveryDate: '2026-05-13',
    warehouse: 'Da Nang DC',
    salesRepresentative: 'Bao Nguyen',
    description: 'Retail replenishment',
    attachment: '2 files',
    note: '-',
  },
  {
    id: '1000025',
    orderNo: 'SO-00025',
    customer: 'Cong ty CP YZA',
    orderDate: '2026-05-05',
    grandTotal: 120000000,
    status: 'processing',
    createdBy: 'Le Van C',
    updatedBy: 'Tran Thi B',
    approvedBy: 'Hoang Lan',
    currency: 'VND',
    paymentTerm: 'Net 45',
    deliveryDate: '2026-05-12',
    warehouse: 'HCM Main',
    salesRepresentative: 'Mai Nguyen',
    description: 'Requires partial shipment',
    attachment: '1 file',
    note: 'Warehouse preparing',
  },
];

export const defaultVisibleOrderLineColumns: SalesOrderLineColumnConfig[] = [
  { key: 'lineNo', label: '#', align: 'center', minWidth: 72 },
  { key: 'product', label: 'Product', minWidth: 180 },
  { key: 'description', label: 'Description', minWidth: 240 },
  { key: 'uom', label: 'UOM', minWidth: 112 },
  { key: 'quantity', label: 'Quantity', align: 'right', minWidth: 128 },
  { key: 'unitPrice', label: 'Unit Price', align: 'right', minWidth: 148 },
  { key: 'discountPercent', label: 'Discount (%)', align: 'right', minWidth: 148 },
  { key: 'taxPercent', label: 'Tax (%)', align: 'right', minWidth: 116 },
  { key: 'amount', label: 'Amount', align: 'right', minWidth: 156 },
];

export const defaultHiddenOrderLineColumns: SalesOrderLineColumnConfig[] = [
  { key: 'warehouse', label: 'Warehouse', minWidth: 164 },
  { key: 'deliveryDate', label: 'Delivery Date', minWidth: 140 },
];

export const orderLineRowsByOrderId: Record<string, SalesOrderLineRow[]> = {
  '1000033': [
    {
      id: '1000033-1',
      lineNo: 1,
      product: 'FIT-SENSOR-A1',
      description: 'Cam bien nhiet do A1',
      uom: 'Cai',
      quantity: 10,
      unitPrice: 1250000,
      discountPercent: 0,
      taxPercent: 10,
      amount: 12500000,
      warehouse: 'Da Nang DC',
      deliveryDate: '2026-05-19',
    },
    {
      id: '1000033-2',
      lineNo: 2,
      product: 'FIT-KIT-B2',
      description: 'Bo kit IoT B2',
      uom: 'Bo',
      quantity: 5,
      unitPrice: 6800000,
      discountPercent: 0,
      taxPercent: 10,
      amount: 34000000,
      warehouse: 'Da Nang DC',
      deliveryDate: '2026-05-19',
    },
    {
      id: '1000033-3',
      lineNo: 3,
      product: 'FIT-CABLE-C4',
      description: 'Cap ket noi C4',
      uom: 'Met',
      quantity: 100,
      unitPrice: 120000,
      discountPercent: 0,
      taxPercent: 10,
      amount: 12000000,
      warehouse: 'Da Nang DC',
      deliveryDate: '2026-05-20',
    },
    {
      id: '1000033-4',
      lineNo: 4,
      product: 'FIT-BRACKET-D1',
      description: 'Gia do D1',
      uom: 'Cai',
      quantity: 20,
      unitPrice: 650000,
      discountPercent: 5,
      taxPercent: 10,
      amount: 12350000,
      warehouse: 'Da Nang DC',
      deliveryDate: '2026-05-20',
    },
    {
      id: '1000033-5',
      lineNo: 5,
      product: 'FIT-BOX-E5',
      description: 'Hop bao ve E5',
      uom: 'Cai',
      quantity: 10,
      unitPrice: 1230000,
      discountPercent: 0,
      taxPercent: 10,
      amount: 12300000,
      warehouse: 'Da Nang DC',
      deliveryDate: '2026-05-20',
    },
  ],
};

export const defaultVisiblePaymentColumns: SalesOrderPaymentColumnConfig[] = [
  { key: 'paymentNo', label: 'Payment No', minWidth: 148 },
  { key: 'method', label: 'Method', minWidth: 148 },
  { key: 'dueDate', label: 'Due Date', minWidth: 136 },
  { key: 'expectedAmount', label: 'Expected Amount', align: 'right', minWidth: 172 },
  { key: 'paidAmount', label: 'Paid Amount', align: 'right', minWidth: 156 },
  { key: 'status', label: 'Status', minWidth: 132 },
];

export const defaultHiddenPaymentColumns: SalesOrderPaymentColumnConfig[] = [
  { key: 'reference', label: 'Reference', minWidth: 180 },
];

export const paymentRowsByOrderId: Record<string, SalesOrderPaymentRow[]> = {
  '1000033': [
    {
      id: '1000033-payment-1',
      paymentNo: 'PAY-00091',
      method: 'Bank transfer',
      dueDate: '2026-05-29',
      expectedAmount: 82750000,
      paidAmount: 0,
      status: 'Pending',
      reference: '-',
    },
  ],
};
