import { Sale, SaleExpense, SaleLineItem } from "@/types"

export function getSaleLineItems(sale: Sale): SaleLineItem[] {
  if (sale.lineItems && sale.lineItems.length > 0) {
    return sale.lineItems
  }

  return [
    {
      id: `${sale.id}-line-0`,
      itemId: sale.itemId,
      itemName: sale.itemName,
      category: sale.category,
      variant: sale.variant,
      sellPrice: sale.sellPrice,
      costPrice: sale.costPrice,
      qty: sale.qty,
      total: sale.total,
      profit: sale.profit,
    },
  ]
}

export function getSaleExpenses(sale: Sale): SaleExpense[] {
  return sale.expenses ?? []
}

export function getSaleTotalUnits(sale: Sale): number {
  return getSaleLineItems(sale).reduce((sum, line) => sum + line.qty, 0)
}

export function getSaleSubtotal(sale: Sale): number {
  if (typeof sale.subtotal === "number") return sale.subtotal
  return getSaleLineItems(sale).reduce((sum, line) => sum + line.total, 0)
}

export function getSaleExpensesTotal(sale: Sale): number {
  if (typeof sale.extraExpensesTotal === "number") return sale.extraExpensesTotal
  return getSaleExpenses(sale).reduce((sum, expense) => sum + expense.amount, 0)
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
