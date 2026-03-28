import { useMemo } from "react"
import { useSalesStore } from "@/store/useSalesStore"
import { useItemsStore } from "@/store/useItemsStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { formatCurrency, getItemBreakdowns } from "@/lib/calculations"
import { getCategoryColor } from "@/lib/utils"
import { BarChart3, TrendingUp } from "lucide-react"

export function ItemBreakdownTable() {
  const sales = useSalesStore(state => state.sales)
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
        <p className="font-heading font-semibold text-foreground">No sales recorded yet</p>
        <p className="text-sm text-muted-foreground max-w-sm mt-1.5">
          Click <span className="font-medium text-primary">Record sale</span> to start tracking your revenue and profits.
        </p>
      </div>
    )
  }

  const totalRevenue = breakdown.reduce((sum, item) => sum + item.revenue, 0)
  const totalProfit = breakdown.reduce((sum, item) => sum + item.profit, 0)
  const totalUnits = breakdown.reduce((sum, item) => sum + item.unitsSold, 0)
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const getMarginColor = (margin: number) => {
    if (margin > 30) return "bg-emerald-500"
    if (margin >= 10) return "bg-amber-500"
    return "bg-red-500"
  }

  const getMarginTextColor = (margin: number) => {
    if (margin > 30) return "text-emerald-400"
    if (margin >= 10) return "text-amber-400"
    return "text-red-400"
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-heading font-semibold">Item Performance</h3>
        <span className="text-xs text-muted-foreground bg-surface px-2 py-0.5 rounded-full border border-border/40">
          {breakdown.length} items
        </span>
      </div>

      <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/80 shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider bg-surface/60 border-b border-border/40">
                <th className="px-5 py-3.5 font-medium">Item</th>
                <th className="px-5 py-3.5 font-medium">Category</th>
                <th className="px-5 py-3.5 font-medium text-right">Units</th>
                <th className="px-5 py-3.5 font-medium text-right">Revenue</th>
                <th className="px-5 py-3.5 font-medium text-right">Profit</th>
                <th className="px-5 py-3.5 font-medium w-36">Margin</th>
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
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                    <span className={item.profit > 0 ? "text-profit" : item.profit < 0 ? "text-loss" : ""}>
                      {formatCurrency(item.profit, currency)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${getMarginColor(item.margin)} transition-all duration-700`}
                          style={{ width: `${Math.min(Math.max(item.margin, 0), 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono w-12 text-right ${getMarginTextColor(item.margin)}`}>
                        {item.margin.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface/60 border-t border-border/40 font-medium">
                <td className="px-5 py-3.5 text-muted-foreground uppercase text-xs tracking-wider">Total</td>
                <td className="px-5 py-3.5"></td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums">{totalUnits}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums">{formatCurrency(totalRevenue, currency)}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                  <span className={totalProfit > 0 ? "text-profit" : totalProfit < 0 ? "text-loss" : ""}>
                    {formatCurrency(totalProfit, currency)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getMarginColor(avgMargin)} transition-all duration-700`}
                        style={{ width: `${Math.min(Math.max(avgMargin, 0), 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-mono w-12 text-right ${getMarginTextColor(avgMargin)}`}>
                      {avgMargin.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
