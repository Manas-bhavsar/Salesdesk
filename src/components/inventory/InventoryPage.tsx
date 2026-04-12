import { useMemo } from "react"
import { useItemsStore } from "@/store/useItemsStore"
import { useSalesStore } from "@/store/useSalesStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { formatCurrency } from "@/lib/calculations"
import { getSaleLineItems } from "@/lib/sales"
import { getCategoryColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Archive, Boxes, CircleDollarSign, PackageCheck, TriangleAlert } from "lucide-react"

type InventoryRow = {
  itemId: string
  itemName: string
  category: string
  totalStock: number
  soldUnits: number
  inStockUnits: number
  oversoldUnits: number
  inventoryValue: number
  soldShare: number
  costLabel: string
  variantDetails: Array<{
    id: string
    name: string
    totalStock: number
    soldUnits: number
    inStockUnits: number
    inventoryValue: number
    costPrice: number
  }>
}

export function InventoryPage() {
  const items = useItemsStore(state => state.items)
  const sales = useSalesStore(state => state.sales)
  const { currency, categories } = useStoreConfig(state => state.config)

  const inventoryRows = useMemo<InventoryRow[]>(() => {
    const soldByItem = new Map<string, number>()
    const soldByVariant = new Map<string, number>()

    for (const sale of sales) {
      for (const lineItem of getSaleLineItems(sale)) {
        soldByItem.set(lineItem.itemId, (soldByItem.get(lineItem.itemId) ?? 0) + lineItem.qty)

        const variantKey = lineItem.variant ? `${lineItem.itemId}:${lineItem.variant}` : null
        if (variantKey) {
          soldByVariant.set(variantKey, (soldByVariant.get(variantKey) ?? 0) + lineItem.qty)
        }
      }
    }

    return items
      .map((item) => {
        if (item.hasVariants) {
          const variantDetails = item.variants.map((variant) => {
            const soldUnits = soldByVariant.get(`${item.id}:${variant.name}`) ?? 0
            const inStockUnits = Math.max(variant.stockQuantity - soldUnits, 0)
            return {
              id: variant.id,
              name: variant.name,
              totalStock: variant.stockQuantity,
              soldUnits,
              inStockUnits,
              inventoryValue: inStockUnits * variant.costPrice,
              costPrice: variant.costPrice,
            }
          })

          const totalStock = variantDetails.reduce((sum, variant) => sum + variant.totalStock, 0)
          const soldUnits = variantDetails.reduce((sum, variant) => sum + variant.soldUnits, 0)
          const inStockUnits = variantDetails.reduce((sum, variant) => sum + variant.inStockUnits, 0)
          const inventoryValue = variantDetails.reduce((sum, variant) => sum + variant.inventoryValue, 0)
          const oversoldUnits = Math.max(soldUnits - totalStock, 0)
          const highestCost = Math.max(...item.variants.map(variant => variant.costPrice), 0)
          const lowestCost = Math.min(...item.variants.map(variant => variant.costPrice), highestCost)

          return {
            itemId: item.id,
            itemName: item.name,
            category: item.category,
            totalStock,
            soldUnits,
            inStockUnits,
            oversoldUnits,
            inventoryValue,
            soldShare: totalStock > 0 ? Math.min((soldUnits / totalStock) * 100, 999) : 0,
            costLabel: lowestCost === highestCost
              ? formatCurrency(lowestCost, currency)
              : `${formatCurrency(lowestCost, currency)} - ${formatCurrency(highestCost, currency)}`,
            variantDetails,
          }
        }

        const soldUnits = soldByItem.get(item.id) ?? 0
        const inStockUnits = Math.max(item.stockQuantity - soldUnits, 0)

        return {
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          totalStock: item.stockQuantity,
          soldUnits,
          inStockUnits,
          oversoldUnits: Math.max(soldUnits - item.stockQuantity, 0),
          inventoryValue: inStockUnits * item.costPrice,
          soldShare: item.stockQuantity > 0 ? Math.min((soldUnits / item.stockQuantity) * 100, 999) : 0,
          costLabel: formatCurrency(item.costPrice, currency),
          variantDetails: [],
        }
      })
      .sort((a, b) => b.inventoryValue - a.inventoryValue)
  }, [currency, items, sales])

  const summary = useMemo(() => {
    return inventoryRows.reduce(
      (totals, row) => ({
        totalProducts: totals.totalProducts + 1,
        totalStock: totals.totalStock + row.totalStock,
        soldUnits: totals.soldUnits + row.soldUnits,
        inStockUnits: totals.inStockUnits + row.inStockUnits,
        inventoryValue: totals.inventoryValue + row.inventoryValue,
        oversoldUnits: totals.oversoldUnits + row.oversoldUnits,
      }),
      {
        totalProducts: 0,
        totalStock: 0,
        soldUnits: 0,
        inStockUnits: 0,
        inventoryValue: 0,
        oversoldUnits: 0,
      }
    )
  }, [inventoryRows])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-[1.75rem] border border-border/50 bg-gradient-to-br from-card via-card to-surface/90 p-5 shadow-lg shadow-black/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
            <Archive className="h-3.5 w-3.5" />
            Inventory
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-heading font-bold tracking-tight sm:text-3xl">Inventory</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Track how much stock each product started with, what has sold, and what your remaining inventory is worth.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Products tracked"
          value={summary.totalProducts.toString()}
          note={`${summary.totalStock} total units added`}
          icon={Boxes}
        />
        <SummaryCard
          title="Units in stock"
          value={summary.inStockUnits.toString()}
          note={`${summary.soldUnits} units sold`}
          icon={PackageCheck}
        />
        <SummaryCard
          title="Inventory value"
          value={formatCurrency(summary.inventoryValue, currency)}
          note="Remaining stock at cost price"
          icon={CircleDollarSign}
        />
        <SummaryCard
          title="Sold share"
          value={summary.totalStock > 0 ? `${Math.round((summary.soldUnits / summary.totalStock) * 100)}%` : "0%"}
          note={summary.oversoldUnits > 0 ? `${summary.oversoldUnits} units oversold` : "Based on stocked quantity"}
          icon={summary.oversoldUnits > 0 ? TriangleAlert : Archive}
          danger={summary.oversoldUnits > 0}
        />
      </div>

      <Card className="overflow-hidden border-border/40 bg-card/80 shadow-sm">
        <CardHeader className="border-b border-border/30 bg-surface/40">
          <CardTitle>Inventory by Product</CardTitle>
          <CardDescription>Sold share is calculated from sales history against the inventory quantity saved in your catalog.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {inventoryRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                <Archive className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="font-heading font-semibold">No inventory yet</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Add products in the catalog with inventory quantities and they will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-surface/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3.5 font-medium">Product</th>
                    <th className="px-5 py-3.5 font-medium text-right">Cost</th>
                    <th className="px-5 py-3.5 font-medium text-right">Stocked</th>
                    <th className="px-5 py-3.5 font-medium text-right">Sold</th>
                    <th className="px-5 py-3.5 font-medium text-right">In Stock</th>
                    <th className="px-5 py-3.5 font-medium text-right">Value</th>
                    <th className="px-5 py-3.5 font-medium">Sold Share</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryRows.map((row, index) => (
                    <tr
                      key={row.itemId}
                      className="border-b border-border/20 align-top last:border-b-0 table-row-animate"
                      style={{ animationDelay: `${index * 35}ms` }}
                    >
                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          <div>
                            <div className="font-medium">{row.itemName}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-2">
                              <span
                                  className="h-2 w-2 rounded-full shadow-sm"
                                  style={{ backgroundColor: getCategoryColor(row.category, categories) }}
                                />
                                {row.category}
                              </span>
                              {row.oversoldUnits > 0 ? (
                                <Badge variant="secondary" className="border-destructive/20 bg-destructive/10 text-destructive">
                                  Oversold by {row.oversoldUnits}
                                </Badge>
                              ) : null}
                            </div>
                          </div>

                          {row.variantDetails.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {row.variantDetails.map((variant) => (
                                <div key={variant.id} className="rounded-xl border border-border/30 bg-background/50 px-3 py-2 text-xs">
                                  <div className="font-medium text-foreground">{variant.name}</div>
                                  <div className="mt-1 text-muted-foreground">
                                    {variant.inStockUnits} left of {variant.totalStock} • {formatCurrency(variant.costPrice, currency)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-mono tabular-nums">{row.costLabel}</td>
                      <td className="px-5 py-4 text-right font-mono tabular-nums">{row.totalStock}</td>
                      <td className="px-5 py-4 text-right font-mono tabular-nums">{row.soldUnits}</td>
                      <td className="px-5 py-4 text-right font-mono tabular-nums">{row.inStockUnits}</td>
                      <td className="px-5 py-4 text-right font-mono tabular-nums">{formatCurrency(row.inventoryValue, currency)}</td>
                      <td className="px-5 py-4 min-w-[180px]">
                        <div className="space-y-2">
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${row.oversoldUnits > 0 ? "bg-destructive" : "bg-primary"}`}
                              style={{ width: `${Math.min(row.soldShare, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{Math.round(row.soldShare)}% sold</span>
                            <span>{row.inStockUnits} left</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  note,
  icon: Icon,
  danger = false,
}: {
  title: string
  value: string
  note: string
  icon: typeof Archive
  danger?: boolean
}) {
  return (
    <Card className="border-border/40 bg-card/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <div className={`rounded-xl p-2 ${danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  )
}
