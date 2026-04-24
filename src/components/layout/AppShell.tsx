import { useState } from "react"
import { Topbar } from "./Topbar"
import { ToastProvider } from "@/components/ui/Toast"
import { Dashboard } from "@/components/dashboard/Dashboard"
import { SalesDetailsDashboard } from "@/components/dashboard/SalesDetailsDashboard"
import { CatalogManager } from "@/components/catalog/CatalogManager"

export type TabType = "dashboard" | "sales" | "catalog"

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")

  return (
    <ToastProvider>
      <Topbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="pt-[56px] min-h-screen w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 pb-16">
          {activeTab === "dashboard" ? <Dashboard onOpenSales={() => setActiveTab("sales")} /> : null}
          {activeTab === "sales" ? <SalesDetailsDashboard /> : null}
          {activeTab === "catalog" ? <CatalogManager /> : null}
        </div>
      </main>
    </ToastProvider>
  )
}
