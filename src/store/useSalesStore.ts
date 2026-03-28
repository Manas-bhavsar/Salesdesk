import { create } from 'zustand'
import { Sale } from '@/types'
import { getSales, setSales as persistSales } from '@/lib/localStorage'

type SalesState = {
  sales: Sale[]
  addSale: (sale: Sale) => void
  updateSale: (id: string, updated: Sale) => void
  deleteSale: (id: string) => void
  setSales: (sales: Sale[]) => void
  
  getTotalRevenue: () => number
  getTotalProfit: () => number
  getSalesByDateRange: (start: string, end: string) => Sale[]
}

const initialSales = typeof window !== 'undefined' ? getSales() : []

export const useSalesStore = create<SalesState>()((set, get) => ({
  sales: initialSales,
  addSale: (sale) => set((state) => {
    const newSales = [...state.sales, sale]
    persistSales(newSales)
    return { sales: newSales }
  }),
  updateSale: (id, updated) => set((state) => {
    const newSales = state.sales.map(s => s.id === id ? updated : s)
    persistSales(newSales)
    return { sales: newSales }
  }),
  deleteSale: (id) => set((state) => {
    const newSales = state.sales.filter(s => s.id !== id)
    persistSales(newSales)
    return { sales: newSales }
  }),
  setSales: (sales) => {
    persistSales(sales)
    set({ sales })
  },
  getTotalRevenue: () => get().sales.reduce((sum, sale) => sum + sale.total, 0),
  getTotalProfit: () => get().sales.reduce((sum, sale) => sum + sale.profit, 0),
  getSalesByDateRange: (start, end) => {
    return get().sales.filter(s => s.date >= start && s.date <= end)
  }
}))
