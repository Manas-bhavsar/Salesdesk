import { useMemo } from "react"
import { useStoreConfig } from "@/store/useStoreConfig"
import { formatCurrency } from "@/lib/calculations"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { PieChart as PieChartIcon, Package2 } from "lucide-react"
import { getSaleLineItems } from "@/lib/sales"
import { Sale } from "@/types"

const COLORS = [
  "#2dd4bf", // teal-400
  "#fbbf24", // amber-400
  "#818cf8", // indigo-400
  "#f472b6", // pink-400
  "#fb7185", // rose-400
  "#38bdf8", // sky-400
  "#a78bfa", // violet-400
  "#fb923c", // orange-400
]

export function ProductMixChart({ sales }: { sales: Sale[] }) {
  const currency = useStoreConfig(state => state.config.currency)

  const { chartData, topProduct } = useMemo(() => {
    if (sales.length === 0) return { chartData: [], topProduct: null }

    // Group by item
    const itemMap = new Map<string, { name: string; units: number; cost: number }>()

    for (const sale of sales) {
      for (const lineItem of getSaleLineItems(sale)) {
        const existing = itemMap.get(lineItem.itemId)
        if (existing) {
          existing.units += lineItem.qty
          existing.cost += lineItem.totalCost
        } else {
          itemMap.set(lineItem.itemId, {
            name: lineItem.itemName,
            units: lineItem.qty,
            cost: lineItem.totalCost,
          })
        }
      }
    }

    const totalUnits = Array.from(itemMap.values()).reduce((sum, v) => sum + v.units, 0)

    const sorted = Array.from(itemMap.values())
      .sort((a, b) => b.units - a.units)
      .map((item, i) => ({
        ...item,
        percent: totalUnits > 0 ? (item.units / totalUnits) * 100 : 0,
        fill: COLORS[i % COLORS.length],
      }))

    return {
      chartData: sorted.slice(0, 8), // Show top 8 items
      topProduct: sorted[0] || null,
    }
  }, [sales])

  if (sales.length === 0) return null

  return (
    <div className="border border-border/40 rounded-2xl bg-card/80 shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <PieChartIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-semibold">Product mix</h3>
            <p className="text-[11px] text-muted-foreground">Units sold by item</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-4 p-4 items-center">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="units"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className="outline-none" />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-card border border-border/60 rounded-xl px-3 py-2 shadow-xl">
                        <p className="text-xs font-semibold mb-1">{data.name}</p>
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Units:</span>
                            <span className="font-mono font-medium">{data.units}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Total Cost:</span>
                            <span className="font-mono font-medium">{formatCurrency(data.cost, currency)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Top product</p>
            {topProduct && (
              <div className="rounded-xl border border-border/40 bg-surface/50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Package2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium truncate">{topProduct.name}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-heading font-bold">{topProduct.units}</span>
                  <span className="text-xs text-muted-foreground">units sold</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Legend</p>
            <div className="grid grid-cols-1 gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
              {chartData.map((entry, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between text-[11px] transition-colors text-muted-foreground hover:text-foreground"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                    <span className="truncate">{entry.name}</span>
                  </div>
                  <span className="font-mono">{entry.percent.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
