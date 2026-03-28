import { useMemo, useState } from "react"
import { useSalesStore } from "@/store/useSalesStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { formatCurrency } from "@/lib/calculations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditSaleModal } from "@/components/sales/EditSaleModal"
import { useToast } from "@/components/ui/Toast"
import { Trash2, Clock, Pencil, CheckCircle2 } from "lucide-react"
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

export function RecentSalesTable() {
  const sales = useSalesStore(state => state.sales)
  const recentSales = useMemo(() => {
    return [...sales].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10)
  }, [sales])
  const deleteSale = useSalesStore(state => state.deleteSale)
  const updateSale = useSalesStore(state => state.updateSale)
  const currency = useStoreConfig(state => state.config.currency)
  const { toast } = useToast()

  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale)
    setEditModalOpen(true)
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

  if (sales.length === 0) return null

  return (
    <div className="space-y-3 animate-in fade-in duration-500 delay-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-heading font-semibold">Recent Sales</h3>
          <span className="text-xs text-muted-foreground bg-surface px-2 py-0.5 rounded-full border border-border/40">
            latest {recentSales.length}
          </span>
        </div>
      </div>

      <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/80 shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider bg-surface/60 border-b border-border/40">
                <th className="px-5 py-3.5 font-medium">Date</th>
                <th className="px-5 py-3.5 font-medium">Item</th>
                <th className="px-5 py-3.5 font-medium">Variant</th>
                <th className="px-5 py-3.5 font-medium text-right">Qty</th>
                <th className="px-5 py-3.5 font-medium text-right">Revenue</th>
                <th className="px-5 py-3.5 font-medium text-right">Profit</th>
                <th className="px-5 py-3.5 font-medium">Payment</th>
                <th className="px-5 py-3.5 font-medium">Customer</th>
                <th className="px-5 py-3.5 font-medium">Note</th>
                <th className="px-5 py-3.5 font-medium text-center w-20"></th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale, i) => (
                <tr
                  key={sale.id}
                  className="group border-b border-border/20 hover:bg-surface-hover/50 transition-colors last:border-b-0 table-row-animate"
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {format(new Date(sale.date + 'T12:00:00'), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-3.5 font-medium">{sale.itemName}</td>
                  <td className="px-5 py-3.5">
                    {sale.variant ? (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/15 font-normal text-[11px]">
                        {sale.variant}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums">{sale.qty}</td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums">{formatCurrency(sale.total, currency)}</td>
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
                  <td className="px-5 py-3.5 text-muted-foreground max-w-[140px] truncate" title={sale.note}>
                    {sale.note || <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(sale)}
                        className="h-7 w-7 text-muted-foreground/40 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sale.id)}
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

      {/* Edit Sale Modal */}
      <EditSaleModal
        sale={editingSale}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => toast("Sale updated successfully")}
      />
    </div>
  )
}
