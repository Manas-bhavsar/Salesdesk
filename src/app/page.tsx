"use client"
import { useStoreConfig } from "@/store/useStoreConfig"
import { SetupWizard } from "@/components/setup/SetupWizard"
import { AppShell } from "@/components/layout/AppShell"
import { useEffect, useState } from "react"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const setupComplete = useStoreConfig(state => state.config.setupComplete)

  useEffect(() => {
    setMounted(true)
  }, [])

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
