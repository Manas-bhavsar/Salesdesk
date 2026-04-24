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

  // Bootstrap client stores from the database once on mount.
  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      try {
        const [config, items, sales] = await Promise.all([
          getStoreConfigAction(),
          getItemsAction(),
          getSalesAction(),
        ])

        if (cancelled) return

        useStoreConfig.setState({ config })
        useItemsStore.setState({ items })
        useSalesStore.setState({ sales })
      } catch (error) {
        console.error("[SalesDesk] Failed to hydrate from database:", error)
      } finally {
        if (!cancelled) {
          setHydrated(true)
        }
      }
    }

    hydrate()

    return () => {
      cancelled = true
    }
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
