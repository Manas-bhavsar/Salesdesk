"use client"

import { useMemo, useState } from "react"
import { useSalesStore } from "@/store/useSalesStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { formatCurrency } from "@/lib/calculations"
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts"
import { PieChart as PieChartIcon } from "lucide-react"

const COLORS = [
  '#e8b931', '#34d399', '#60a5fa', '#f87171',
  '#a78bfa', '#fb923c', '#ec4899', '#14b8a6',
  '#8b5cf6', '#f59e0b'
]

// Custom tooltip
function ChartTooltip({ active, payload, currency }: {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  currency: string
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-2xl shadow-black/40">
      <p className="text-xs font-medium mb-1.5">{data.name}</p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Units:</span>
          <span className="font-mono font-semibold">{data.units}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Revenue:</span>
          <span className="font-mono font-semibold">{formatCurrency(data.revenue, currency)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Share:</span>
          <span className="font-mono font-semibold">{data.percent.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}



export function ProductMixChart() {
  const sales = useSalesStore(state => state.sales)
  const currency = useStoreConfig(state => state.config.currency)
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  const { chartData, topProduct } = useMemo(() => {
    if (sales.length === 0) return { chartData: [], topProduct: null }

    // Group by item
    const itemMap = new Map<string, { name: string; units: number; revenue: number }>()

    for (const sale of sales) {
      const existing = itemMap.get(sale.itemId)
      if (existing) {
        existing.units += sale.qty
        existing.revenue += sale.total
      } else {
        itemMap.set(sale.itemId, {
          name: sale.itemName,
          units: sale.qty,
          revenue: sale.total,
        })
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
      chartData: sorted,
      topProduct: sorted.length > 0 ? sorted[0] : null,
    }
  }, [sales])

  const hasData = chartData.length > 0

  return (
    <div className="border border-border/40 rounded-2xl bg-card/80 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <PieChartIcon className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-semibold">Product Mix</h3>
            <p className="text-[11px] text-muted-foreground">Sales distribution by item</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
          <PieChartIcon className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="text-sm font-medium">No product data yet</p>
          <p className="text-xs text-muted-foreground/70">Record sales to see the breakdown</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-2">
          {/* Donut */}
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="units"
                  strokeWidth={0}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      opacity={activeIndex === undefined || activeIndex === index ? 1 : 0.4}
                      stroke={activeIndex === index ? entry.fill : 'none'}
                      strokeWidth={activeIndex === index ? 3 : 0}
                      style={{
                        transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: '50% 50%',
                        transition: 'all 0.2s ease-out',
                        filter: activeIndex === index ? 'drop-shadow(0 0 8px rgba(255,255,255,0.15))' : 'none',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip currency={currency} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend + Top product */}
          <div className="w-full lg:w-1/2 px-5 pb-5 lg:pb-0 lg:pr-5 space-y-3">
            {/* Top product highlight */}
            {topProduct && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/15">
                <div className="text-[10px] text-amber-400 uppercase tracking-wider font-medium mb-1">🏆 Top Seller</div>
                <div className="text-sm font-heading font-semibold">{topProduct.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {topProduct.units} units · {formatCurrency(topProduct.revenue, currency)}
                </div>
              </div>
            )}

            {/* Legend items */}
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
              {chartData.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 group cursor-default"
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs flex-1 truncate transition-colors duration-200 group-hover:text-foreground text-muted-foreground">
                    {item.name}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    {item.percent.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
