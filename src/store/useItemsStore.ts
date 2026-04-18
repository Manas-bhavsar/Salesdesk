import { create } from 'zustand'
import { Item } from '@/types'
import { addItemAction, updateItemAction, deleteItemAction, setItemsAction } from '@/actions/items'

type ItemsState = {
  items: Item[]
  addItem: (item: Item) => void
  updateItem: (id: string, updated: Item) => void
  deleteItem: (id: string) => void
  setItems: (items: Item[]) => void
}

export const useItemsStore = create<ItemsState>()((set) => ({
  items: [],
  addItem: (item) => set((state) => {
    const newItems = [...state.items, item]
    addItemAction(item)
    return { items: newItems }
  }),
  updateItem: (id, updated) => set((state) => {
    const newItems = state.items.map(i => i.id === id ? updated : i)
    updateItemAction(id, updated)
    return { items: newItems }
  }),
  deleteItem: (id) => set((state) => {
    const newItems = state.items.filter(i => i.id !== id)
    deleteItemAction(id)
    return { items: newItems }
  }),
  setItems: (items) => {
    setItemsAction(items)
    set({ items })
  }
}))
