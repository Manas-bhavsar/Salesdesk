import { AddSaleModal } from "@/components/sales/AddSaleModal"
import { EditSaleModal } from "@/components/sales/EditSaleModal"
import { SaleDetailsModal } from "@/components/sales/SaleDetailsModal"
import { StatCards } from "./StatCards"
import { SalesProfitChart } from "./SalesProfitChart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useMemo, useState } from "react"
import { Plus, Activity, ArrowRight, Package2, Wallet, Clock3, Pencil, Trash2, CheckCircle2 } from "lucide-react"
import { useSalesStore } from "@/store/useSalesStore"
import { formatCurrency } from "@/lib/calculations"
import { useStoreConfig } from "@/store/useStoreConfig"
import { getSaleItemsSummary } from "@/lib/sales"
import { useToast } from "@/components/ui/Toast"
import { format } from "date-fns"
import { Sale } from "@/types"

function PaymentBadge({ sale, onMarkPaid }: { sale: Sale, onMarkPaid: (sale: Sale) => void }) {
  const status = sale.paymentStatus || 'paid'
  const currency = useStoreConfig(state => state.config.currency)

  if (status === 'paid') {
    return (
      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/15 text-[11px] font-normal">
        Paid
      </Badge>
    )
  }

  if (status === 'unpaid') {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/15 text-[11px] font-normal">
          Unpaid
        </Badge>
        <button
          onClick={(e) => { e.stopPropagation(); onMarkPaid(sale) }}
          className="h-5 w-5 rounded flex items-center justify-center text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200"
          title="Mark as paid"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  // half-paid
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/15 text-[11px] font-normal">
        Due {formatCurrency(sale.amountDue || 0, currency)}
      </Badge>
      <button
        onClick={(e) => { e.stopPropagation(); onMarkPaid(sale) }}
        className="h-5 w-5 rounded flex items-center justify-center text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200"
        title="Mark as paid"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function Dashboard({ onOpenSales }: { onOpenSales: () => void }) {
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  const sales = useSalesStore(state => state.sales)
  const deleteSale = useSalesStore(state => state.deleteSale)
  const updateSale = useSalesStore(state => state.updateSale)
  const currency = useStoreConfig(state => state.config.currency)
  const { toast } = useToast()

  // Quick summary stats
  const recentSalesCount = useMemo(() => {
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)
    const threshold = sevenDaysAgo.toISOString().slice(0, 10)
    return sales.filter((sale) => sale.date >= threshold).length
  }, [sales])

  // Last 5 sales (sorted by date desc, then createdAt desc)
  const lastFiveSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date)
        if (dateCompare !== 0) return dateCompare
        return b.createdAt - a.createdAt
      })
      .slice(0, 5)
  }, [sales])

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale)
    setEditModalOpen(true)
  }

  const handleOpenDetails = (sale: Sale) => {
    setSelectedSale(sale)
    setDetailsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this sale record?")) {
      deleteSale(id)
      toast("Sale deleted successfully")
    }
  }

  const handleMarkPaid = (sale: Sale) => {
    updateSale(sale.id, {
      ...sale,
      paymentStatus: 'paid',
      amountDue: 0,
    })
    toast("Sale marked as paid ✓")
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="rounded-[1.75rem] border border-border/50 bg-gradient-to-br from-card via-card to-surface/90 p-5 shadow-lg shadow-black/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
              <Activity className="h-3.5 w-3.5" />
              Overview
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-heading font-bold tracking-tight sm:text-3xl">Dashboard</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Quick summary of your store. Head to the Sales page for filters and full details.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={onOpenSales} className="border-border/60 bg-background/40">
              <ArrowRight className="h-4 w-4" />
              Sales page
            </Button>
            <Button
              onClick={() => setSaleModalOpen(true)}
              className="shadow-lg shadow-primary/20 hover:shadow-primary/40"
            >
              <Plus className="h-4 w-4" />
              Add sale
            </Button>
          </div>
        </div>

        {/* Quick summary pills */}
        {sales.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 pt-4 border-t border-border/30">
            <div className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-1.5 text-xs">
              <Package2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold">{sales.length} sales</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/40 px-3 py-1.5 text-xs">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">This week:</span>
              <span className="font-semibold">{recentSalesCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Money Section */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/12 p-2 text-primary">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold">Money</h2>
            <p className="text-sm text-muted-foreground">Check totals and sales movement in one place.</p>
          </div>
        </div>

        <StatCards sales={sales} />
        <SalesProfitChart sales={sales} />
      </section>

      {/* Last 5 Sales */}
      {lastFiveSales.length > 0 && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/12 p-2 text-primary">
                <Package2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold">Recent Sales</h2>
                <p className="text-sm text-muted-foreground">Last {lastFiveSales.length} transaction{lastFiveSales.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onOpenSales} className="text-muted-foreground hover:text-primary">
              View all
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/80 shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider bg-surface/60 border-b border-border/40">
                    <th className="px-5 py-3.5 font-medium">Date</th>
                    <th className="px-5 py-3.5 font-medium">Items</th>
                    <th className="px-5 py-3.5 font-medium text-right">Amount</th>
                    <th className="px-5 py-3.5 font-medium text-right">Profit</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 font-medium">Customer</th>
                    <th className="px-5 py-3.5 font-medium text-center w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {lastFiveSales.map((sale, i) => (
                    <tr
                      key={sale.id}
                      className="group border-b border-border/20 hover:bg-surface-hover/50 transition-colors last:border-b-0 table-row-animate cursor-pointer"
                      style={{ animationDelay: `${i * 35}ms` }}
                      onClick={() => handleOpenDetails(sale)}
                    >
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {format(new Date(sale.date + 'T12:00:00'), 'MMM d, yyyy')}
                      </td>
                      <td className="px-5 py-3.5 font-medium">{getSaleItemsSummary(sale)}</td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums">{formatCurrency(sale.totalSoldPrice, currency)}</td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                        <span className={sale.profit > 0 ? "text-profit" : sale.profit < 0 ? "text-loss" : ""}>
                          {formatCurrency(sale.profit, currency)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <PaymentBadge sale={sale} onMarkPaid={handleMarkPaid} />
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground max-w-[140px] truncate" title={sale.customerName || ""}>
                        {sale.customerName || <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(sale)
                            }}
                            className="h-7 w-7 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(sale.id)
                            }}
                            className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Empty state when no sales */}
      {sales.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/50 rounded-2xl bg-surface/50 text-center animate-in fade-in duration-500">
          <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Package2 className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="font-heading font-semibold text-foreground">No sales yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mt-1.5">
            Click <span className="font-medium text-primary">Add sale</span> to record your first transaction.
          </p>
        </div>
      )}

      <AddSaleModal open={saleModalOpen} onOpenChange={setSaleModalOpen} />
      <SaleDetailsModal
        sale={selectedSale}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
      <EditSaleModal
        sale={editingSale}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => toast("Sale updated successfully")}
      />
    </div>
  )
}
