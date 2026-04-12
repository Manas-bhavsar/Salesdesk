import { Item, Sale } from "@/types"

export type SalesFilters = {
  itemIds: string[]
  dateFrom: string
  dateTo: string
  customerQuery: string
}

export type SalesSortOption =
  | "date-desc"
  | "date-asc"
  | "revenue-desc"
  | "revenue-asc"
  | "profit-desc"
  | "profit-asc"
  | "customer-asc"
  | "customer-desc"

export const defaultSalesFilters: SalesFilters = {
  itemIds: [],
  dateFrom: "",
  dateTo: "",
  customerQuery: "",
}

export const salesSortOptions: Array<{ value: SalesSortOption; label: string }> = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "revenue-desc", label: "Revenue high to low" },
  { value: "revenue-asc", label: "Revenue low to high" },
  { value: "profit-desc", label: "Profit high to low" },
  { value: "profit-asc", label: "Profit low to high" },
  { value: "customer-asc", label: "Customer A to Z" },
  { value: "customer-desc", label: "Customer Z to A" },
]

export function hasActiveSalesFilters(filters: SalesFilters) {
  return (
    filters.itemIds.length > 0 ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.customerQuery.trim())
  )
}

export function filterSales(sales: Sale[], filters: SalesFilters) {
  const customerQuery = filters.customerQuery.trim().toLowerCase()

  return sales.filter((sale) => {
    if (filters.itemIds.length > 0 && !filters.itemIds.includes(sale.itemId)) return false
    if (filters.dateFrom && sale.date < filters.dateFrom) return false
    if (filters.dateTo && sale.date > filters.dateTo) return false
    if (customerQuery && !sale.customerName?.toLowerCase().includes(customerQuery)) return false
    return true
  })
}

export function sortSales(sales: Sale[], sortBy: SalesSortOption) {
  return [...sales].sort((left, right) => {
    switch (sortBy) {
      case "date-asc":
        return left.date.localeCompare(right.date) || left.createdAt - right.createdAt
      case "date-desc":
        return right.date.localeCompare(left.date) || right.createdAt - left.createdAt
      case "revenue-asc":
        return left.totalSoldPrice - right.totalSoldPrice || right.createdAt - left.createdAt
      case "revenue-desc":
        return right.totalSoldPrice - left.totalSoldPrice || right.createdAt - left.createdAt
      case "profit-asc":
        return left.profit - right.profit || right.createdAt - left.createdAt
      case "profit-desc":
        return right.profit - left.profit || right.createdAt - left.createdAt
      case "customer-asc":
        return (left.customerName || "zzzz").localeCompare(right.customerName || "zzzz") || right.createdAt - left.createdAt
      case "customer-desc":
        return (right.customerName || "").localeCompare(left.customerName || "") || right.createdAt - left.createdAt
      default:
        return right.createdAt - left.createdAt
    }
  })
}

export function getItemsWithSales(items: Item[], sales: Sale[]) {
  const itemIds = new Set(sales.map((sale) => sale.itemId))
  return items.filter((item) => itemIds.has(item.id))
}

export function getUniqueCustomers(sales: Sale[]) {
  const names = new Set<string>()

  sales.forEach((sale) => {
    if (sale.customerName?.trim()) names.add(sale.customerName.trim())
  })

  return Array.from(names).sort((left, right) => left.localeCompare(right))
}
