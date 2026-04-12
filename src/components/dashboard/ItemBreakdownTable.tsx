import { useMemo } from "react"
import { useItemsStore } from "@/store/useItemsStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { formatCurrency, getItemBreakdowns } from "@/lib/calculations"
import { getCategoryColor } from "@/lib/utils"
import { BarChart3, TrendingUp } from "lucide-react"
import { Sale } from "@/types"

export function ItemBreakdownTable({ sales }: { sales: Sale[] }) {
  const items = useItemsStore(state => state.items)
  const breakdown = useMemo(() => getItemBreakdowns(items, sales), [items, sales])
  const currency = useStoreConfig(state => state.config.currency)
  const categories = useStoreConfig(state => state.config.categories)

  if (breakdown.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/50 rounded-2xl bg-surface/50 text-center animate-in fade-in duration-500">
        <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <BarChart3 className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <p className="font-heading font-semibold text-foreground">No item summary yet</p>
        <p className="text-sm text-muted-foreground max-w-sm mt-1.5">
          Add a sale to see which items are being sold.
        </p>
      </div>
    )
  }

  const totalCost = breakdown.reduce((sum, item) => sum + item.revenue, 0) // revenue field holds cost in new system
  const totalUnits = breakdown.reduce((sum, item) => sum + item.unitsSold, 0)

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-heading font-semibold">Item usage</h3>
        <span className="text-xs text-muted-foreground bg-surface px-2 py-0.5 rounded-full border border-border/40">
          {breakdown.length} items
        </span>
      </div>

      <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/80 shadow-sm">
        <div className="overflow-auto custom-scrollbar max-h-[440px]">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 z-10">
              <tr className="text-xs text-muted-foreground uppercase tracking-wider bg-surface border-b border-border/40">
                <th className="px-5 py-3.5 font-medium">Item</th>
                <th className="px-5 py-3.5 font-medium">Category</th>
                <th className="px-5 py-3.5 font-medium text-right">Units Sold</th>
                <th className="px-5 py-3.5 font-medium text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((item, i) => (
                <tr
                  key={item.itemId}
                  className="border-b border-border/20 hover:bg-surface-hover/50 transition-colors last:border-b-0 table-row-animate"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <td className="px-5 py-3.5 font-medium">{item.itemName}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full shadow-sm shrink-0"
                        style={{ backgroundColor: getCategoryColor(item.category, categories) }}
                      />
                      <span className="truncate max-w-[120px] text-muted-foreground">{item.category}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums">{item.unitsSold}</td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums">{formatCurrency(item.revenue, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Totals row pinned at the bottom */}
        <div className="border-t border-border/40">
          <table className="w-full text-sm text-left">
            <tfoot>
              <tr className="bg-surface/60 font-medium">
                <td className="px-5 py-3.5 text-muted-foreground uppercase text-xs tracking-wider">Total</td>
                <td className="px-5 py-3.5"></td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums">{totalUnits}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums">{formatCurrency(totalCost, currency)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
