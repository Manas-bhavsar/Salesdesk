import { useSalesStore } from "@/store/useSalesStore"
import { useItemsStore } from "@/store/useItemsStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { formatCurrency } from "@/lib/calculations"
import { TrendingUp, IndianRupee, ShoppingBag, Package, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react"

export function StatCards() {
  const sales = useSalesStore(state => state.sales)
  const getTotalRevenue = useSalesStore(state => state.getTotalRevenue)
  const getTotalProfit = useSalesStore(state => state.getTotalProfit)
  const items = useItemsStore(state => state.items)
  const currency = useStoreConfig(state => state.config.currency)

  const revenue = getTotalRevenue()
  const profit = getTotalProfit()
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0
  const totalUnits = sales.reduce((sum, s) => sum + s.qty, 0)

  // Calculate total unpaid amount
  const totalUnpaid = sales.reduce((sum, s) => {
    const status = s.paymentStatus || 'paid'
    if (status === 'unpaid') return sum + s.total
    if (status === 'half-paid') return sum + (s.amountDue || 0)
    return sum
  }, 0)

  const unpaidCount = sales.filter(s => (s.paymentStatus || 'paid') !== 'paid').length

  const stats = [
    {
      label: "Net Revenue",
      value: formatCurrency(revenue, currency),
      sub: `${totalUnits} units sold`,
      icon: IndianRupee,
      gradient: "from-amber-500/15 to-amber-600/5",
      iconBg: "bg-amber-500/15 text-amber-400",
      border: "hover:border-amber-500/20",
    },
    {
      label: "Net Profit",
      value: formatCurrency(profit, currency),
      sub: `${margin.toFixed(1)}% margin`,
      icon: TrendingUp,
      gradient: profit >= 0 ? "from-emerald-500/15 to-emerald-600/5" : "from-red-500/15 to-red-600/5",
      iconBg: profit >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400",
      border: profit >= 0 ? "hover:border-emerald-500/20" : "hover:border-red-500/20",
      valueColor: profit > 0 ? "text-profit" : profit < 0 ? "text-loss" : "",
      trend: profit > 0 ? "up" as const : profit < 0 ? "down" as const : null,
    },
    {
      label: "Unpaid Amount",
      value: formatCurrency(totalUnpaid, currency),
      sub: unpaidCount > 0 ? `${unpaidCount} pending bill${unpaidCount !== 1 ? 's' : ''}` : "all bills cleared",
      icon: AlertCircle,
      gradient: totalUnpaid > 0 ? "from-red-500/15 to-red-600/5" : "from-emerald-500/15 to-emerald-600/5",
      iconBg: totalUnpaid > 0 ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400",
      border: totalUnpaid > 0 ? "hover:border-red-500/20" : "hover:border-emerald-500/20",
      valueColor: totalUnpaid > 0 ? "text-loss" : "text-profit",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className={`group relative rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 ${stat.border} hover:shadow-lg hover:shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-500`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Gradient shimmer at top */}
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
                <div className={`h-9 w-9 rounded-xl ${stat.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-2xl font-heading font-bold tracking-tight ${stat.valueColor || ""}`}>
                    {stat.value}
                  </h3>
                  {stat.trend === "up" && <ArrowUpRight className="h-4 w-4 text-profit" />}
                  {stat.trend === "down" && <ArrowDownRight className="h-4 w-4 text-loss" />}
                </div>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
