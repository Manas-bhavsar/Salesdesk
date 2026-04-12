import { RecentSalesTable } from "./RecentSalesTable"
import { AddSaleModal } from "@/components/sales/AddSaleModal"
import { ExportFiltersModal } from "@/components/sales/ExportFiltersModal"
import { ImportExcelModal } from "@/components/import/ImportExcelModal"
import { Button } from "@/components/ui/button"
import { useMemo, useState } from "react"
import { Download, Upload, Plus, Activity, CalendarRange, Filter, Package2, Search, SlidersHorizontal, X, ListOrdered } from "lucide-react"
import { useSalesStore } from "@/store/useSalesStore"
import { useItemsStore } from "@/store/useItemsStore"
import { useToast } from "@/components/ui/Toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SalesFilters, SalesSortOption, defaultSalesFilters, filterSales, getItemsWithSales, getUniqueCustomers, hasActiveSalesFilters, salesSortOptions, sortSales } from "@/lib/salesFilters"
import { formatCurrency } from "@/lib/calculations"
import { useStoreConfig } from "@/store/useStoreConfig"

export function SalesDetailsDashboard() {
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [filters, setFilters] = useState<SalesFilters>(defaultSalesFilters)
  const [sortBy, setSortBy] = useState<SalesSortOption>("date-desc")
  const sales = useSalesStore(state => state.sales)
  const setSales = useSalesStore(state => state.setSales)
  const items = useItemsStore(state => state.items)
  const currency = useStoreConfig(state => state.config.currency)
  const { toast } = useToast()

  const filteredSales = useMemo(() => filterSales(sales, filters), [sales, filters])
  const sortedFilteredSales = useMemo(() => sortSales(filteredSales, sortBy), [filteredSales, sortBy])
  const itemsWithSales = useMemo(() => getItemsWithSales(items, sales), [items, sales])
  const exportModalKey = `${exportModalOpen}-${filters.itemIds.join(",")}-${filters.dateFrom}-${filters.dateTo}-${filters.customerQuery}`
  const suggestedCustomers = useMemo(() => {
    const names = getUniqueCustomers(sales)
    const query = filters.customerQuery.trim().toLowerCase()
    if (!query) return names.slice(0, 8)
    return names.filter((name) => name.toLowerCase().includes(query)).slice(0, 8)
  }, [sales, filters.customerQuery])

  const filteredRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalSoldPrice, 0)
  const filteredProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0)
  const filteredUnpaid = filteredSales.reduce((sum, sale) => {
    const status = sale.paymentStatus || "paid"
    if (status === "unpaid") return sum + sale.totalSoldPrice
    if (status === "half-paid") return sum + (sale.amountDue || 0)
    return sum
  }, 0)
  const activeFilters = hasActiveSalesFilters(filters)

  const toggleItem = (itemId: string) => {
    setFilters((prev) => ({
      ...prev,
      itemIds: prev.itemIds.includes(itemId)
        ? prev.itemIds.filter((id) => id !== itemId)
        : [...prev.itemIds, itemId],
    }))
  }

  const clearFilters = () => setFilters(defaultSalesFilters)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="rounded-[1.75rem] border border-border/50 bg-gradient-to-br from-card via-card to-surface/90 p-5 shadow-lg shadow-black/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
              <Activity className="h-3.5 w-3.5" />
              Sales details
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-heading font-bold tracking-tight sm:text-3xl">Sales</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Filter, sort, export, and review the full sales data here.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              className="border-border/60 bg-background/40"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button
              variant="outline"
              onClick={() => setExportModalOpen(true)}
              disabled={filteredSales.length === 0}
              className="border-border/60 bg-background/40"
            >
              <Download className="h-4 w-4" />
              Export this view
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
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/12 p-2 text-primary">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold">Find sales</h2>
            <p className="text-sm text-muted-foreground">Use these filters to control everything on this page.</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">From date</Label>
                <div className="relative">
                  <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                    className="h-11 rounded-xl border-border/60 bg-background/50 pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">To date</Label>
                <div className="relative">
                  <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                    className="h-11 rounded-xl border-border/60 bg-background/50 pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Customer name</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    placeholder="Type a customer name"
                    value={filters.customerQuery}
                    onChange={(e) => setFilters((prev) => ({ ...prev, customerQuery: e.target.value }))}
                    className="h-11 rounded-xl border-border/60 bg-background/50 pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Sort by</Label>
                <div className="relative">
                  <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SalesSortOption)}
                    className="h-11 w-full appearance-none rounded-xl border border-border/60 bg-card pl-9 pr-10 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-ring/30"
                  >
                    {salesSortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border/50 bg-background/30 p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Package2 className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Items</p>
                    <p className="text-xs text-muted-foreground">Pick items if you only want to see part of your sales.</p>
                  </div>
                </div>
                {activeFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reset filters
                  </button>
                )}
              </div>
              {itemsWithSales.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items have sales yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {itemsWithSales.map((item) => {
                    const isSelected = filters.itemIds.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className={`
                          inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200
                          ${isSelected
                            ? "border-primary/35 bg-primary/12 text-primary shadow-sm shadow-primary/10"
                            : "border-border/60 bg-card/70 text-muted-foreground hover:border-border hover:text-foreground"
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
              {suggestedCustomers.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    Quick names
                  </span>
                  {suggestedCustomers.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, customerQuery: name }))}
                      className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] text-primary transition-colors hover:bg-primary/20"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-primary/12 p-2 text-primary">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-semibold">What you are viewing</h3>
                <p className="text-xs text-muted-foreground">These numbers match the current filters.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Sales shown</p>
                <p className="mt-2 text-2xl font-heading font-bold">{filteredSales.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeFilters ? `${sales.length - filteredSales.length} sales are hidden right now` : "You are seeing all sales"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Sales amount</p>
                <p className="mt-2 text-2xl font-heading font-bold">{formatCurrency(filteredRevenue, currency)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Profit in this view: {formatCurrency(filteredProfit, currency)}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Money still due</p>
                <p className="mt-2 text-2xl font-heading font-bold">{formatCurrency(filteredUnpaid, currency)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Export will use these same filters.</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/12 p-2 text-primary">
            <ListOrdered className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold">Sales list</h2>
            <p className="text-sm text-muted-foreground">Review, edit, and mark payments here.</p>
          </div>
        </div>

        <RecentSalesTable sales={sortedFilteredSales} />
      </section>

      <AddSaleModal open={saleModalOpen} onOpenChange={setSaleModalOpen} />
      <ExportFiltersModal
        key={exportModalKey}
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        initialFilters={filters}
        onSuccess={() => toast("Sales exported to Excel successfully")}
      />
      <ImportExcelModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        mode="sales"
        onImportSales={(imported) => {
          setSales([...sales, ...imported])
          toast(`${imported.length} sale${imported.length !== 1 ? 's' : ''} imported successfully`)
        }}
      />
    </div>
  )
}
