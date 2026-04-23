"use client"
import { useStoreConfig } from "@/store/useStoreConfig"
import { useItemsStore } from "@/store/useItemsStore"
import { useSalesStore } from "@/store/useSalesStore"
import { SetupWizard } from "@/components/setup/SetupWizard"
import { AppShell } from "@/components/layout/AppShell"
import { useEffect, useState } from "react"
import { getStoreConfigAction } from "@/actions/storeConfig"
import { getItemsAction } from "@/actions/items"
import { getSalesAction } from "@/actions/sales"

export default function Home() {
  const [hydrated, setHydrated] = useState(false)
  const setupComplete = useStoreConfig(state => state.config.setupComplete)
  const setConfig = useStoreConfig(state => state.setConfig)
  const setItems = useItemsStore(state => state.setItems)
  const setSales = useSalesStore(state => state.setSales)

  // Hydrate Zustand stores from the database
  useEffect(() => {
    async function hydrate() {
      try {
        const [config, items, sales] = await Promise.all([
          getStoreConfigAction(),
          getItemsAction(),
          getSalesAction(),
        ])

        // Use deep compare to avoid unnecessary re-renders
        const currentConfig = useStoreConfig.getState().config;
        if (JSON.stringify(currentConfig) !== JSON.stringify(config)) {
          useStoreConfig.setState({ config })
        }

        const currentItems = useItemsStore.getState().items;
        if (JSON.stringify(currentItems) !== JSON.stringify(items)) {
          useItemsStore.setState({ items })
        }

        const currentSales = useSalesStore.getState().sales;
        if (JSON.stringify(currentSales) !== JSON.stringify(sales)) {
          useSalesStore.setState({ sales })
        }
      } catch (error) {
        console.error("[SalesDesk] Failed to hydrate from database:", error)
      } finally {
        setHydrated(true)
      }
    }

    hydrate()
    
    // Poll every 5 seconds to keep multiple devices in sync
    const interval = setInterval(hydrate, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-lg bg-primary/20 animate-pulse" />
      </div>
    )
  }

  if (!setupComplete) {
    return <SetupWizard />
  }

  return (
    <div className="min-h-screen bg-background relative w-full">
      <AppShell />
    </div>
  )
}
