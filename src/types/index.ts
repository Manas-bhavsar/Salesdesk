export type StoreConfig = {
  name: string
  owner: string
  currency: string
  categories: string[]
  setupComplete: boolean
}

export type Variant = {
  id: string
  name: string
  sellPrice: number
  costPrice: number
}

export type Item = {
  id: string
  name: string
  category: string
  sku: string
  sellPrice: number
  costPrice: number
  hasVariants: boolean
  variants: Variant[]
  createdAt: number
}

export type PaymentStatus = 'paid' | 'unpaid' | 'half-paid'

export type SaleLineItem = {
  id: string
  itemId: string
  itemName: string
  category: string
  variant: string | null
  sellPrice: number
  costPrice: number
  qty: number
  total: number
  profit: number
}

export type SaleExpense = {
  id: string
  label: string
  amount: number
}

export type Sale = {
  id: string
  itemId: string
  itemName: string
  category: string
  variant: string | null
  sellPrice: number
  costPrice: number
  qty: number
  total: number
  profit: number
  date: string
  note: string
  customerName: string
  paymentStatus: PaymentStatus
  amountDue: number
  createdAt: number
  lineItems?: SaleLineItem[]
  expenses?: SaleExpense[]
  subtotal?: number
  extraExpensesTotal?: number
}

export type ItemBreakdown = {
  itemId: string
  itemName: string
  category: string
  unitsSold: number
  revenue: number
  profit: number
  margin: number
}

export type AppBackup = {
  version: 1
  exportedAt: string
  storeConfig: StoreConfig
  items: Item[]
  sales: Sale[]
}
