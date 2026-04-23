import * as xlsx from "xlsx"
import { Item, Sale } from "@/types"
import { format } from "date-fns"
import { getSaleExpenses, getSaleExpensesTotal, getSaleItemsSummary, getSaleLineItems, getSaleTotalUnits, getSaleVariantSummary } from "@/lib/sales"

export function exportItemsCatalog(items: Item[], currency: string): void {
  void currency
  let data = items.map(item => {
    return {
      "Item Name": item.name,
      "Category": item.category,
      "Cost Price": item.hasVariants ? "" : item.costPrice,
      "Inventory Qty": item.hasVariants ? "" : item.stockQuantity,
      "Has Variants": item.hasVariants ? "Yes" : "No",
      "Variant Names": item.hasVariants ? item.variants.map(v => v.name).join(" | ") : "",
      "Variant Cost Prices": item.hasVariants ? item.variants.map(v => v.costPrice).join(" | ") : "",
      "Variant Inventory Qty": item.hasVariants ? item.variants.map(v => v.stockQuantity).join(" | ") : ""
    }
  })

  // Filter out columns where all rows have empty strings, null, or undefined
  if (data.length > 0) {
    const keys = Object.keys(data[0]) as (keyof typeof data[0])[]
    const keysToRemove = keys.filter(key => data.every(row => row[key] === "" || row[key] === null || row[key] === undefined))
    
    data = data.map(row => {
      const newRow = { ...row }
      for (const key of keysToRemove) {
        delete newRow[key]
      }
      return newRow
    })
  }

  const ws = xlsx.utils.json_to_sheet(data)
  
  if (data.length > 0) {
    const currentKeys = Object.keys(data[0])
    const defaultWidths: Record<string, number> = {
      "Item Name": 25,
      "Category": 15,
      "Cost Price": 12,
      "Inventory Qty": 12,
      "Has Variants": 12,
      "Variant Names": 30,
      "Variant Cost Prices": 20,
      "Variant Inventory Qty": 20
    }
    ws['!cols'] = currentKeys.map(key => ({ wch: defaultWidths[key] || 15 }))
  }

  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, "Catalog")

  const dateStr = format(new Date(), "yyyy-MM-dd")
  xlsx.writeFile(wb, `catalog_export_${dateStr}.xlsx`)
}

export function exportSalesData(sales: Sale[], currency: string): void {
  void currency
  let data = sales.map(sale => {
    const expenses = getSaleExpenses(sale)
    return {
      "Customer": sale.customerName || "",
      "Date": sale.date,
      "Items": getSaleItemsSummary(sale),
      "Categories": Array.from(new Set(getSaleLineItems(sale).map(line => line.category))).join(" | "),
      "Variant": getSaleVariantSummary(sale) || "",
      "Qty": getSaleTotalUnits(sale),
      "Line Items": getSaleLineItems(sale).map(line => `${line.itemName}${line.variant ? ` (${line.variant})` : ""} x${line.qty}`).join(" | "),
      "Total Cost": sale.totalCost,
      "Sold Price": sale.totalSoldPrice,
      "Extra Expenses": getSaleExpensesTotal(sale),
      "Expense Details": expenses.map(expense => `${expense.label}: ${expense.amount}`).join(" | "),
      "Profit": sale.profit,
      "Payment Status": sale.paymentStatus || "paid",
      "Amount Due": sale.amountDue || 0,
      "Note": sale.note || ""
    }
  })

  // Filter out columns where all rows have empty strings, null, or undefined
  if (data.length > 0) {
    const keys = Object.keys(data[0]) as (keyof typeof data[0])[]
    const keysToRemove = keys.filter(key => data.every(row => row[key] === "" || row[key] === null || row[key] === undefined))
    
    data = data.map(row => {
      const newRow = { ...row }
      for (const key of keysToRemove) {
        delete newRow[key]
      }
      return newRow
    })
  }

  const ws = xlsx.utils.json_to_sheet(data)
  
  if (data.length > 0) {
    const currentKeys = Object.keys(data[0])
    const defaultWidths: Record<string, number> = {
      "Date": 12,
      "Items": 25,
      "Categories": 18,
      "Variant": 15,
      "Qty": 8,
      "Line Items": 42,
      "Total Cost": 12,
      "Sold Price": 12,
      "Extra Expenses": 14,
      "Expense Details": 30,
      "Profit": 12,
      "Payment Status": 14,
      "Amount Due": 12,
      "Customer": 20,
      "Note": 30
    }
    ws['!cols'] = currentKeys.map(key => ({ wch: defaultWidths[key] || 15 }))
  }

  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, "Sales")

  const dateStr = format(new Date(), "yyyy-MM-dd")
  xlsx.writeFile(wb, `sales_export_${dateStr}.xlsx`)
}
