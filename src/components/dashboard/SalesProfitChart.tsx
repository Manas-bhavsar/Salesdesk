"use client"

import { useMemo } from "react"
import { useStoreConfig } from "@/store/useStoreConfig"
import { formatCurrency } from "@/lib/calculations"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts"
import { BarChart3 } from "lucide-react"
import { format, subMonths, eachMonthOfInterval, startOfMonth } from "date-fns"
import { Sale } from "@/types"

// Custom tooltip matching the app's dark theme
function ChartTooltip({ active, payload, label, currency }: {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  label?: string
  currency: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-2xl shadow-black/40">
      <p className="text-xs text-muted-foreground mb-2 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-semibold">{formatCurrency(entry.value, currency)}</span>
        </div>
      ))}
    </div>
  )
}

export function SalesProfitChart({ sales }: { sales: Sale[] }) {
  const currency = useStoreConfig(state => state.config.currency)

  const chartData = useMemo(() => {
    if (sales.length === 0) return []

    const sortedDates = sales
      .map((sale) => new Date(`${sale.date}T12:00:00`))
      .sort((left, right) => left.getTime() - right.getTime())

    const latestMonth = startOfMonth(sortedDates[sortedDates.length - 1])
    const earliestMonth = startOfMonth(sortedDates[0])
    const start = earliestMonth > subMonths(latestMonth, 11) ? earliestMonth : startOfMonth(subMonths(latestMonth, 11))
    const end = latestMonth

    const months = eachMonthOfInterval({ start, end })

    // Group sales by month
    const monthMap = new Map<string, { revenue: number; profit: number }>()
    months.forEach(m => {
      const key = format(m, "yyyy-MM")
      monthMap.set(key, { revenue: 0, profit: 0 })
    })

    for (const sale of sales) {
      const monthKey = sale.date.substring(0, 7) // "yyyy-MM"
      const entry = monthMap.get(monthKey)
      if (entry) {
        entry.revenue += sale.totalSoldPrice
        entry.profit += sale.profit
      }
    }

    return months.map(m => {
      const key = format(m, "yyyy-MM")
      const data = monthMap.get(key) || { revenue: 0, profit: 0 }
      return {
        name: format(m, "MMM yyyy"),
        date: key,
        revenue: Math.round(data.revenue * 100) / 100,
        profit: Math.round(data.profit * 100) / 100,
      }
    })
  }, [sales])

  const hasData = chartData.some(d => d.revenue > 0 || d.profit > 0)

  return (
    <div className="border border-border/40 rounded-2xl bg-card/80 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-semibold">Sales over time</h3>
            <p className="text-[11px] text-muted-foreground">Sales and profit by month</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf]" />
            <span className="text-muted-foreground">Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
            <span className="text-muted-foreground">Profit</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 pb-4 pt-2">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground">
            <BarChart3 className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm font-medium">No sales to show yet</p>
            <p className="text-xs text-muted-foreground/70">Add a sale to see this chart</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barGap={2} barCategoryGap="20%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                dx={-4}
                tickFormatter={(v) => {
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
                  return v.toString()
                }}
              />
              <Tooltip
                content={<ChartTooltip currency={currency} />}
                cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }}
              />
              <Legend content={() => null} />
              <Bar
                dataKey="revenue"
                name="Sales"
                fill="#2dd4bf"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
              <Bar
                dataKey="profit"
                name="Profit"
                fill="#fbbf24"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
