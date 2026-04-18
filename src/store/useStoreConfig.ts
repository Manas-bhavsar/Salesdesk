import { create } from 'zustand'
import { StoreConfig } from '@/types'
import { updateStoreConfigAction } from '@/actions/storeConfig'

type StoreConfigState = {
  config: StoreConfig
  setConfig: (config: StoreConfig) => void
  updateCategories: (categories: string[]) => void
  resetStore: () => void
}

const defaultConfig: StoreConfig = {
  name: '',
  owner: '',
  currency: '₹',
  categories: ['Electronics', 'Clothing', 'Food', 'Books', 'Accessories', 'Other'],
  setupComplete: false
}

export const useStoreConfig = create<StoreConfigState>()((set) => ({
  config: defaultConfig,
  setConfig: (config) => {
    set({ config })
    updateStoreConfigAction(config)
  },
  updateCategories: (categories) => set((state) => {
    const newConfig = { ...state.config, categories }
    updateStoreConfigAction(newConfig)
    return { config: newConfig }
  }),
  resetStore: () => {
    set({ config: defaultConfig })
  }
}))
