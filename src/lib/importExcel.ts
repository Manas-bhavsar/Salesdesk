import * as xlsx from "xlsx"
import { Item, Sale, Variant, SaleLineItem } from "@/types"

// ─── Types ───

export type RawRow = Record<string, unknown>

export type ParsedWorkbook = {
  sheetNames: string[]
  sheets: Record<string, RawRow[]>
}

export type ColumnMapping = Record<string, string | null> // targetField -> headerName

// ─── Parse workbook from File ───

export async function parseWorkbook(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer()
  const wb = xlsx.read(buffer, { type: "array", cellDates: true })

  const result: ParsedWorkbook = {
    sheetNames: wb.SheetNames,
    sheets: {},
  }

  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name]
    result.sheets[name] = xlsx.utils.sheet_to_json<RawRow>(sheet, {
      defval: "",
      raw: false,
    })
  }

  return result
}

// ─── Fuzzy header matching ───

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
}

type FieldAliases = { field: string; aliases: string[] }

const ITEM_FIELD_ALIASES: FieldAliases[] = [
  { field: "name", aliases: ["item name", "product name", "name", "product", "item"] },
  { field: "category", aliases: ["category", "cat", "type", "group"] },
  { field: "costPrice", aliases: ["cost price", "cost", "purchase price", "buying price", "cp"] },
  { field: "stockQuantity", aliases: ["inventory qty", "stock", "quantity", "qty", "stock quantity", "inventory quantity", "units"] },
  { field: "hasVariants", aliases: ["has variants", "variants?", "has variant"] },
  { field: "variantNames", aliases: ["variant names", "variants", "variant name"] },
  { field: "variantCostPrices", aliases: ["variant cost prices", "variant costs", "variant cost price"] },
  { field: "variantStockQuantities", aliases: ["variant inventory qty", "variant stock", "variant stock quantities", "variant inventory"] },
]

const SALE_FIELD_ALIASES: FieldAliases[] = [
  { field: "date", aliases: ["date", "sale date", "transaction date", "sold on", "order date"] },
  { field: "itemName", aliases: ["item", "items", "item name", "product", "product name"] },
  { field: "category", aliases: ["category", "cat", "type", "group"] },
  { field: "variant", aliases: ["variant", "size", "color", "option"] },
  { field: "qty", aliases: ["qty", "quantity", "units", "count", "no of units", "num"] },
  { field: "costPrice", aliases: ["cost price", "cost", "cp", "purchase price", "buying price"] },
  { field: "totalSoldPrice", aliases: ["total", "revenue", "amount", "sale amount", "gross", "total amount", "sold price"] },
  { field: "profit", aliases: ["profit", "margin", "earnings", "net", "net profit"] },
  { field: "customerName", aliases: ["customer", "customer name", "buyer", "client", "client name"] },
  { field: "note", aliases: ["note", "notes", "remarks", "comments", "description"] },
  { field: "paymentStatus", aliases: ["payment status", "status", "payment", "paid/unpaid", "paid"] },
  { field: "amountDue", aliases: ["amount due", "due", "balance", "outstanding", "remaining"] },
]

function matchField(header: string, aliases: FieldAliases[]): string | null {
  const norm = normalize(header)
  if (!norm) return null

  for (const { field, aliases: fieldAliases } of aliases) {
    for (const alias of fieldAliases) {
      if (normalize(alias) === norm) return field
    }
  }
  return null
}

export function detectItemColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const usedHeaders = new Set<string>()

  // Initialize all fields to null
  for (const { field } of ITEM_FIELD_ALIASES) {
    mapping[field] = null
  }

  for (const header of headers) {
    const field = matchField(header, ITEM_FIELD_ALIASES)
    if (field && !mapping[field] && !usedHeaders.has(header)) {
      mapping[field] = header
      usedHeaders.add(header)
    }
  }

  return mapping
}

export function detectSaleColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const usedHeaders = new Set<string>()

  for (const { field } of SALE_FIELD_ALIASES) {
    mapping[field] = null
  }

  for (const header of headers) {
    const field = matchField(header, SALE_FIELD_ALIASES)
    if (field && !mapping[field] && !usedHeaders.has(header)) {
      mapping[field] = header
      usedHeaders.add(header)
    }
  }

  return mapping
}

// ─── Get available target fields ───

export function getItemFields(): { field: string; label: string }[] {
  return [
    { field: "name", label: "Item Name" },
    { field: "category", label: "Category" },
    { field: "costPrice", label: "Cost Price" },
    { field: "stockQuantity", label: "Inventory Qty" },
    { field: "hasVariants", label: "Has Variants" },
    { field: "variantNames", label: "Variant Names" },
    { field: "variantCostPrices", label: "Variant Cost Prices" },
    { field: "variantStockQuantities", label: "Variant Stock Qty" },
  ]
}

export function getSaleFields(): { field: string; label: string }[] {
  return [
    { field: "date", label: "Date" },
    { field: "itemName", label: "Item Name" },
    { field: "category", label: "Category" },
    { field: "variant", label: "Variant" },
    { field: "qty", label: "Quantity" },
    { field: "costPrice", label: "Cost Price" },
    { field: "totalSoldPrice", label: "Sold Price" },
    { field: "profit", label: "Profit" },
    { field: "customerName", label: "Customer" },
    { field: "note", label: "Note" },
    { field: "paymentStatus", label: "Payment Status" },
    { field: "amountDue", label: "Amount Due" },
  ]
}

// ─── Row mapping helpers ───

function getVal(row: RawRow, mapping: ColumnMapping, field: string): string {
  const header = mapping[field]
  if (!header) return ""
  const val = row[header]
  if (val === null || val === undefined) return ""
  return String(val).trim()
}

function getNumVal(row: RawRow, mapping: ColumnMapping, field: string): number {
  const str = getVal(row, mapping, field)
  const num = parseFloat(str.replace(/[^0-9.\-]/g, ""))
  return isNaN(num) ? 0 : num
}

// ─── Map rows to Items ───

export type ImportItemsResult = {
  items: Item[]
  skippedCount: number
}

export function mapRowsToItems(
  rows: RawRow[],
  mapping: ColumnMapping,
  defaultCategory: string
): ImportItemsResult {
  let skippedCount = 0
  const items: Item[] = []

  for (const row of rows) {
    const name = getVal(row, mapping, "name")
    if (!name) {
      skippedCount++
      continue
    }

    const category = getVal(row, mapping, "category") || defaultCategory
    const costPrice = getNumVal(row, mapping, "costPrice")
    const stockQuantity = Math.round(getNumVal(row, mapping, "stockQuantity"))

    // Check for variants
    const hasVariantsStr = getVal(row, mapping, "hasVariants").toLowerCase()
    const variantNamesStr = getVal(row, mapping, "variantNames")
    const hasVariants = hasVariantsStr === "yes" || hasVariantsStr === "true" || (!!variantNamesStr && variantNamesStr.includes("|"))

    let variants: Variant[] = []

    if (hasVariants && variantNamesStr) {
      const varNames = variantNamesStr.split("|").map((s) => s.trim()).filter(Boolean)
      const varCostPricesStr = getVal(row, mapping, "variantCostPrices")
      const varStockStr = getVal(row, mapping, "variantStockQuantities")
      const varCosts = varCostPricesStr ? varCostPricesStr.split("|").map((s) => parseFloat(s.trim()) || 0) : []
      const varStock = varStockStr ? varStockStr.split("|").map((s) => Math.round(parseFloat(s.trim()) || 0)) : []

      variants = varNames.map((vName, i) => ({
        id: crypto.randomUUID(),
        name: vName,
        sellPrice: 0,
        costPrice: varCosts[i] ?? 0,
        stockQuantity: varStock[i] ?? 0,
      }))
    }

    items.push({
      id: crypto.randomUUID(),
      name,
      category,
      sellPrice: 0,
      costPrice: hasVariants ? 0 : costPrice,
      stockQuantity: hasVariants ? 0 : stockQuantity,
      hasVariants,
      variants,
      createdAt: Date.now(),
    })
  }

  return { items, skippedCount }
}

// ─── Map rows to Sales ───

export type ImportSalesResult = {
  sales: Sale[]
  skippedCount: number
}

function parseDate(val: string): string {
  if (!val) return new Date().toISOString().slice(0, 10)

  // Try ISO format first (yyyy-mm-dd)
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    return val.slice(0, 10)
  }

  // Try common formats
  const d = new Date(val)
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10)
  }

  // dd/mm/yyyy or dd-mm-yyyy
  const parts = val.split(/[\/\-.]/)
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number)
    // If first part > 12, assume dd/mm/yyyy
    if (a > 12 && b <= 12) {
      const date = new Date(c < 100 ? c + 2000 : c, b - 1, a)
      if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10)
    }
    // mm/dd/yyyy
    if (a <= 12 && b <= 31) {
      const date = new Date(c < 100 ? c + 2000 : c, a - 1, b)
      if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10)
    }
  }

  return new Date().toISOString().slice(0, 10)
}

function parsePaymentStatus(val: string): "paid" | "unpaid" | "half-paid" {
  const lower = val.toLowerCase().trim()
  if (lower === "unpaid" || lower === "no" || lower === "false") return "unpaid"
  if (lower === "half-paid" || lower === "half paid" || lower === "partial" || lower === "partially paid") return "half-paid"
  return "paid"
}

export function mapRowsToSales(
  rows: RawRow[],
  mapping: ColumnMapping,
  existingItems: Item[]
): ImportSalesResult {
  let skippedCount = 0
  const sales: Sale[] = []

  for (const row of rows) {
    const itemName = getVal(row, mapping, "itemName")
    if (!itemName) {
      skippedCount++
      continue
    }

    const date = parseDate(getVal(row, mapping, "date"))
    const category = getVal(row, mapping, "category") || "Uncategorized"
    const variant = getVal(row, mapping, "variant") || null
    const qty = Math.max(1, Math.round(getNumVal(row, mapping, "qty")) || 1)
    const costPrice = getNumVal(row, mapping, "costPrice")
    const customerName = getVal(row, mapping, "customerName")
    const note = getVal(row, mapping, "note")
    const paymentStatus = parsePaymentStatus(getVal(row, mapping, "paymentStatus"))
    const amountDue = getNumVal(row, mapping, "amountDue")

    // Try to link to an existing item
    const matchedItem = existingItems.find(
      (item) => item.name.toLowerCase() === itemName.toLowerCase()
    )
    const itemId = matchedItem?.id ?? `imported-${crypto.randomUUID()}`
    const resolvedCategory = matchedItem?.category ?? category

    // Calculate totalSoldPrice and profit — use provided values, or derive
    const totalSoldPrice = getNumVal(row, mapping, "totalSoldPrice")
    const totalCost = costPrice * qty
    let profit = getNumVal(row, mapping, "profit")
    if (!profit) profit = totalSoldPrice - totalCost

    const lineItems: SaleLineItem[] = [{
      id: crypto.randomUUID(),
      itemId,
      itemName,
      category: resolvedCategory,
      variant,
      costPrice,
      sellPrice: totalSoldPrice / qty,
      qty,
      totalCost
    }]

    sales.push({
      id: crypto.randomUUID(),
      itemId,
      itemName,
      category: resolvedCategory,
      variant,
      totalCost,
      totalSoldPrice,
      profit,
      date,
      note,
      customerName,
      paymentStatus,
      amountDue: paymentStatus === "paid" ? 0 : amountDue,
      createdAt: Date.now(),
      lineItems,
      expenses: [],
      extraExpensesTotal: 0
    })
  }

  return { sales, skippedCount }
}
