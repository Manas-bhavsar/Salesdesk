import { create } from 'zustand'
import { Sale } from '@/types'
import { addSaleAction, updateSaleAction, deleteSaleAction, setSalesAction } from '@/actions/sales'

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

export const useSalesStore = create<SalesState>()((set, get) => ({
  sales: [],
  addSale: (sale) => set((state) => {
    const newSales = [...state.sales, sale]
    addSaleAction(sale)
    return { sales: newSales }
  }),
  updateSale: (id, updated) => set((state) => {
    const newSales = state.sales.map(s => s.id === id ? updated : s)
    updateSaleAction(id, updated)
    return { sales: newSales }
  }),
  deleteSale: (id) => set((state) => {
    const newSales = state.sales.filter(s => s.id !== id)
    deleteSaleAction(id)
    return { sales: newSales }
  }),
  setSales: (sales) => {
    setSalesAction(sales)
    set({ sales })
  },
  getTotalRevenue: () => get().sales.reduce((sum, sale) => sum + sale.totalSoldPrice, 0),
  getTotalProfit: () => get().sales.reduce((sum, sale) => sum + sale.profit, 0),
  getSalesByDateRange: (start, end) => {
    return get().sales.filter(s => s.date >= start && s.date <= end)
  }
}))
