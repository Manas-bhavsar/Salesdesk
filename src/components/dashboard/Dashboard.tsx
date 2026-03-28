import { StatCards } from "./StatCards"
import { SalesProfitChart } from "./SalesProfitChart"
import { ProductMixChart } from "./ProductMixChart"
import { ItemBreakdownTable } from "./ItemBreakdownTable"
import { RecentSalesTable } from "./RecentSalesTable"
import { AddSaleModal } from "@/components/sales/AddSaleModal"
import { ExportFiltersModal } from "@/components/sales/ExportFiltersModal"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Download, Plus, Activity } from "lucide-react"
import { useSalesStore } from "@/store/useSalesStore"
import { useToast } from "@/components/ui/Toast"

export function Dashboard() {
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const sales = useSalesStore(state => state.sales)
  const { toast } = useToast()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-heading font-bold tracking-tight">Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Track your sales performance and inventory insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setExportModalOpen(true)}
            disabled={sales.length === 0}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => setSaleModalOpen(true)}
            className="shadow-lg shadow-primary/20 hover:shadow-primary/40"
          >
            <Plus className="h-4 w-4" />
            Record sale
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <StatCards />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesProfitChart />
        <ProductMixChart />
      </div>

      {/* Tables */}
      <div className="space-y-6">
        <ItemBreakdownTable />
        <RecentSalesTable />
      </div>

      <AddSaleModal open={saleModalOpen} onOpenChange={setSaleModalOpen} />
      <ExportFiltersModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        onSuccess={() => toast("Sales exported to Excel successfully")}
      />
    </div>
  )
}
