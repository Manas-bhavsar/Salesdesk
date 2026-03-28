"use client"
import { useStoreConfig } from "@/store/useStoreConfig"
import { SetupWizard } from "@/components/setup/SetupWizard"
import { AppShell } from "@/components/layout/AppShell"
import { useSyncExternalStore } from "react"

function subscribe() {
  return () => {}
}

export default function Home() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const setupComplete = useStoreConfig(state => state.config.setupComplete)

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
