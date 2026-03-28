import { create } from 'zustand'
import { StoreConfig } from '@/types'
import { getStoreConfig, setStoreConfig } from '@/lib/localStorage'

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

// Hydrate on creation but we might need to handle SSR safely. 
// Since this is generic client state, localstorage getter works fine if used client-side.
const initialConfig = typeof window !== 'undefined' ? (getStoreConfig() || defaultConfig) : defaultConfig;

export const useStoreConfig = create<StoreConfigState>()((set) => ({
  config: initialConfig,
  setConfig: (config) => {
    setStoreConfig(config)
    set({ config })
  },
  updateCategories: (categories) => set((state) => {
    const newConfig = { ...state.config, categories }
    setStoreConfig(newConfig)
    return { config: newConfig }
  }),
  resetStore: () => {
    setStoreConfig(defaultConfig)
    set({ config: defaultConfig })
  }
}))
