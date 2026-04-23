import { useState } from "react"
import { Topbar } from "./Topbar"
import dynamic from "next/dynamic"
import { ToastProvider } from "@/components/ui/Toast"

const Dashboard = dynamic(() => import("@/components/dashboard/Dashboard").then(m => ({ default: m.Dashboard })), { 
  loading: () => <div className="flex justify-center items-center h-64 text-muted-foreground animate-pulse">Loading dashboard...</div>
})
const SalesDetailsDashboard = dynamic(() => import("@/components/dashboard/SalesDetailsDashboard").then(m => ({ default: m.SalesDetailsDashboard })), { 
  loading: () => <div className="flex justify-center items-center h-64 text-muted-foreground animate-pulse">Loading sales...</div>
})
const CatalogManager = dynamic(() => import("@/components/catalog/CatalogManager").then(m => ({ default: m.CatalogManager })), { 
  loading: () => <div className="flex justify-center items-center h-64 text-muted-foreground animate-pulse">Loading catalog...</div>
})

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
