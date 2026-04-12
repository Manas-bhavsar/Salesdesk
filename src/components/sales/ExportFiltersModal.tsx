import { useMemo, useState } from "react"
import { useItemsStore } from "@/store/useItemsStore"
import { useSalesStore } from "@/store/useSalesStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { exportSalesData } from "@/lib/exportExcel"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/calculations"
import { SalesFilters, defaultSalesFilters, filterSales, getItemsWithSales, getUniqueCustomers, hasActiveSalesFilters } from "@/lib/salesFilters"
import { Download, Filter, X, Calendar, Package, User, FileSpreadsheet } from "lucide-react"

interface ExportFiltersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialFilters?: Partial<SalesFilters>
}

export function ExportFiltersModal({ open, onOpenChange, onSuccess, initialFilters }: ExportFiltersModalProps) {
  const sales = useSalesStore(state => state.sales)
  const items = useItemsStore(state => state.items)
  const currency = useStoreConfig(state => state.config.currency)

  // Filters
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => initialFilters?.itemIds ?? [...defaultSalesFilters.itemIds])
  const [dateFrom, setDateFrom] = useState(() => initialFilters?.dateFrom ?? defaultSalesFilters.dateFrom)
  const [dateTo, setDateTo] = useState(() => initialFilters?.dateTo ?? defaultSalesFilters.dateTo)
  const [customerSearch, setCustomerSearch] = useState(() => initialFilters?.customerQuery ?? defaultSalesFilters.customerQuery)

  // Reset filters when modal opens
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
  }

  // Get unique items that have sales
  const itemsWithSales = useMemo(() => {
    return getItemsWithSales(items, sales)
  }, [sales, items])

  // Get unique customer names from sales
  const uniqueCustomers = useMemo(() => {
    return getUniqueCustomers(sales)
  }, [sales])

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return uniqueCustomers
    const q = customerSearch.toLowerCase()
    return uniqueCustomers.filter(c => c.toLowerCase().includes(q))
  }, [uniqueCustomers, customerSearch])

  // Apply filters
  const filteredSales = useMemo(() => {
    return filterSales(sales, {
      itemIds: selectedItemIds,
      dateFrom,
      dateTo,
      customerQuery: customerSearch,
    })
  }, [sales, selectedItemIds, dateFrom, dateTo, customerSearch])

  // Summary stats for filtered data
  const summary = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalSoldPrice, 0)
    const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0)
    return { count: filteredSales.length, totalRevenue, totalProfit }
  }, [filteredSales])

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => (
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    ))
  }

  const clearAllFilters = () => {
    setSelectedItemIds([])
    setDateFrom("")
    setDateTo("")
    setCustomerSearch("")
  }

  const hasActiveFilters = hasActiveSalesFilters({
    itemIds: selectedItemIds,
    dateFrom,
    dateTo,
    customerQuery: customerSearch,
  })

  const handleExport = () => {
    if (filteredSales.length === 0) return
    exportSalesData(filteredSales, currency)
    onOpenChange(false)
    if (onSuccess) onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Export Sales</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Pick which sales you want to export
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Clear all button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <X className="h-3 w-3" />
                Reset filters
              </button>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <Label className="text-sm font-medium">Date</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="exportDateFrom" className="text-xs text-muted-foreground">From</Label>
                <Input
                  id="exportDateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="exportDateTo" className="text-xs text-muted-foreground">To</Label>
                <Input
                  id="exportDateTo"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Item Filter */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-400" />
                <Label className="text-sm font-medium">Items</Label>
              </div>
              {selectedItemIds.length > 0 && (
                <span className="text-[11px] text-primary font-medium">
                  {selectedItemIds.length} selected
                </span>
              )}
            </div>
            {itemsWithSales.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No items have sales yet</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {itemsWithSales.map(item => {
                  const isSelected = selectedItemIds.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        border transition-all duration-200 cursor-pointer
                        ${isSelected
                          ? 'bg-primary/15 text-primary border-primary/30 shadow-sm shadow-primary/10'
                          : 'bg-surface border-border/40 text-muted-foreground hover:border-border hover:text-foreground'
                        }
                      `}
                    >
                      {item.name}
                      {isSelected && <X className="h-3 w-3" />}
                    </button>
                  )
                })}
              </div>
            )}
            {selectedItemIds.length === 0 && itemsWithSales.length > 0 && (
              <p className="text-[11px] text-muted-foreground/70">All items are included by default</p>
            )}
          </div>

          {/* Customer Filter */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-violet-400" />
              <Label className="text-sm font-medium">Customer name</Label>
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                placeholder="Type a customer name"
                className="pl-9"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
              />
            </div>
            {customerSearch.trim() && filteredCustomers.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {filteredCustomers.slice(0, 8).map(name => (
                  <Badge
                    key={name}
                    variant="secondary"
                    className="bg-violet-500/10 text-violet-400 border-violet-500/15 text-[11px] cursor-pointer hover:bg-violet-500/20 transition-colors"
                    onClick={() => setCustomerSearch(name)}
                  >
                    {name}
                  </Badge>
                ))}
                {filteredCustomers.length > 8 && (
                  <span className="text-[11px] text-muted-foreground self-center">
                    +{filteredCustomers.length - 8} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Preview Summary */}
          <div className="p-4 bg-surface rounded-xl border border-border/40 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Preview</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sales</div>
                <div className="text-lg font-heading font-bold">{summary.count}</div>
                <div className="text-[10px] text-muted-foreground">of {sales.length} total</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sales amount</div>
                <div className="text-sm font-mono font-semibold">{formatCurrency(summary.totalRevenue, currency)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Profit</div>
                <div className={`text-sm font-mono font-semibold ${summary.totalProfit > 0 ? 'text-profit' : summary.totalProfit < 0 ? 'text-loss' : ''}`}>
                  {formatCurrency(summary.totalProfit, currency)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={filteredSales.length === 0}>
            <Download className="h-4 w-4" />
            Export {filteredSales.length} record{filteredSales.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
