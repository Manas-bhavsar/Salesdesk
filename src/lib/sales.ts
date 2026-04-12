import { Sale, SaleExpense, SaleLineItem } from "@/types"

export function getSaleLineItems(sale: Sale): SaleLineItem[] {
  return sale.lineItems || []
}

export function getSaleExpenses(sale: Sale): SaleExpense[] {
  return sale.expenses ?? []
}

export function getSaleTotalUnits(sale: Sale): number {
  return getSaleLineItems(sale).reduce((sum, line) => sum + line.qty, 0)
}

export function getSaleTotalCost(sale: Sale): number {
  return sale.totalCost
}

export function getSaleExpensesTotal(sale: Sale): number {
  return sale.extraExpensesTotal || 0
}

export function getSaleItemsSummary(sale: Sale): string {
  const lineItems = getSaleLineItems(sale)
  if (lineItems.length === 0) return "—"
  if (lineItems.length === 1) return lineItems[0].itemName
  return `${lineItems[0].itemName} +${lineItems.length - 1} more`
}

export function getSaleVariantSummary(sale: Sale): string | null {
  const lineItems = getSaleLineItems(sale)
  if (lineItems.length !== 1) return null
  return lineItems[0].variant
}
