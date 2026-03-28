import * as xlsx from "xlsx"
import { Item, Sale } from "@/types"
import { format } from "date-fns"

export function exportItemsCatalog(items: Item[], currency: string): void {
  void currency
  let data = items.map(item => {
    return {
      "Item Name": item.name,
      "Category": item.category,
      "SKU": item.sku || "",
      "Sell Price": item.hasVariants ? "" : item.sellPrice,
      "Cost Price": item.hasVariants ? "" : item.costPrice,
      "Has Variants": item.hasVariants ? "Yes" : "No",
      "Variant Names": item.hasVariants ? item.variants.map(v => v.name).join(" | ") : "",
      "Variant Sell Prices": item.hasVariants ? item.variants.map(v => v.sellPrice).join(" | ") : "",
      "Variant Cost Prices": item.hasVariants ? item.variants.map(v => v.costPrice).join(" | ") : ""
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
      "SKU": 12,
      "Sell Price": 12,
      "Cost Price": 12,
      "Has Variants": 12,
      "Variant Names": 30,
      "Variant Sell Prices": 20,
      "Variant Cost Prices": 20
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
    return {
      "Date": sale.date,
      "Item Name": sale.itemName,
      "Category": sale.category,
      "Variant": sale.variant || "",
      "Qty": sale.qty,
      "Sell Price": sale.sellPrice,
      "Cost Price": sale.costPrice,
      "Revenue": sale.total,
      "Profit": sale.profit,
      "Payment Status": sale.paymentStatus || "paid",
      "Amount Due": sale.amountDue || 0,
      "Customer": sale.customerName || "",
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
      "Item Name": 25,
      "Category": 15,
      "Variant": 15,
      "Qty": 8,
      "Sell Price": 12,
      "Cost Price": 12,
      "Revenue": 12,
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
