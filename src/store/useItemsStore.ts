import { create } from 'zustand'
import { Item } from '@/types'
import { getItems, setItems as persistItems } from '@/lib/localStorage'

type ItemsState = {
  items: Item[]
  addItem: (item: Item) => void
  updateItem: (id: string, updated: Item) => void
  deleteItem: (id: string) => void
  setItems: (items: Item[]) => void
}

const initialItems = typeof window !== 'undefined' ? getItems() : []

export const useItemsStore = create<ItemsState>()((set) => ({
  items: initialItems,
  addItem: (item) => set((state) => {
    const newItems = [...state.items, item]
    persistItems(newItems)
    return { items: newItems }
  }),
  updateItem: (id, updated) => set((state) => {
    const newItems = state.items.map(i => i.id === id ? updated : i)
    persistItems(newItems)
    return { items: newItems }
  }),
  deleteItem: (id) => set((state) => {
    const newItems = state.items.filter(i => i.id !== id)
    persistItems(newItems)
    return { items: newItems }
  }),
  setItems: (items) => {
    persistItems(items)
    set({ items })
  }
}))
