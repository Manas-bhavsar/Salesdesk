"use client"
import { useStoreConfig } from "@/store/useStoreConfig"
import { useItemsStore } from "@/store/useItemsStore"
import { useSalesStore } from "@/store/useSalesStore"
import { SetupWizard } from "@/components/setup/SetupWizard"
import { AppShell } from "@/components/layout/AppShell"
import { useSyncExternalStore, useEffect } from "react"
import { hydrateFromIndexedDB } from "@/lib/localStorage"

function subscribe() {
  return () => {}
}

export default function Home() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const setupComplete = useStoreConfig(state => state.config.setupComplete)
  const setConfig = useStoreConfig(state => state.setConfig)
  const setItems = useItemsStore(state => state.setItems)
  const setSales = useSalesStore(state => state.setSales)

  // Hydrate from IndexedDB on mount — recovers data if localStorage was cleared
  useEffect(() => {
    hydrateFromIndexedDB().then((result) => {
      if (result.restoredFromIDB) {
        if (result.config) setConfig(result.config)
        if (result.items) setItems(result.items)
        if (result.sales) setSales(result.sales)
        console.log("[SalesDesk] Data restored from IndexedDB")
      }
    })
  }, [setConfig, setItems, setSales])

  if (!mounted) {
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
