import { Sale } from "@/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useStoreConfig } from "@/store/useStoreConfig"
import { formatCurrency } from "@/lib/calculations"
import { getSaleExpenses, getSaleExpensesTotal, getSaleLineItems, getSaleTotalCost, getSaleTotalUnits } from "@/lib/sales"
import { CalendarDays, CreditCard, Package2, Receipt, StickyNote, User, Wallet } from "lucide-react"
import { format } from "date-fns"

function DetailCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-heading font-bold">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function PaymentStatusBadge({ sale }: { sale: Sale }) {
  const currency = useStoreConfig(state => state.config.currency)
  const status = sale.paymentStatus || "paid"

  if (status === "paid") {
    return (
      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/15">
        Paid
      </Badge>
    )
  }

  if (status === "unpaid") {
    return (
      <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/15">
        Unpaid
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/15">
      Due {formatCurrency(sale.amountDue || 0, currency)}
    </Badge>
  )
}

interface SaleDetailsModalProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaleDetailsModal({ sale, open, onOpenChange }: SaleDetailsModalProps) {
  const currency = useStoreConfig(state => state.config.currency)

  if (!sale) return null

  const lineItems = getSaleLineItems(sale)
  const expenses = getSaleExpenses(sale)
  const totalCost = getSaleTotalCost(sale)
  const expensesTotal = getSaleExpensesTotal(sale)
  const totalUnits = getSaleTotalUnits(sale)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[920px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/12 flex items-center justify-center text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl">Sale details</DialogTitle>
                <PaymentStatusBadge sale={sale} />
              </div>
              <DialogDescription className="text-sm">
                Open one sale and see the items, payment, costs, and notes in one place.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DetailCard
              label="Total sold price"
              value={formatCurrency(sale.totalSoldPrice, currency)}
              sub={`${totalUnits} items`}
            />
            <DetailCard
              label="Net Profit"
              value={formatCurrency(sale.profit, currency)}
              sub={sale.totalSoldPrice > 0 ? `${((sale.profit / sale.totalSoldPrice) * 100).toFixed(1)}% margin` : undefined}
            />
            <DetailCard
              label="Items cost"
              value={formatCurrency(totalCost, currency)}
              sub={`${lineItems.length} line item${lineItems.length !== 1 ? "s" : ""}`}
            />
            <DetailCard
              label="Extra expenses"
              value={formatCurrency(expensesTotal, currency)}
              sub={expenses.length > 0 ? `${expenses.length} expense${expenses.length !== 1 ? "s" : ""}` : "No extra expenses"}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
            <section className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Package2 className="h-4 w-4 text-amber-400" />
                <div>
                  <h3 className="text-base font-heading font-semibold">Items in this bill</h3>
                  <p className="text-xs text-muted-foreground">List of items and their cost prices.</p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="py-3 text-left font-medium">Item</th>
                      <th className="py-3 text-left font-medium">Type</th>
                      <th className="py-3 text-right font-medium">Qty</th>
                      <th className="py-3 text-right font-medium">Unit Cost</th>
                      <th className="py-3 text-right font-medium">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-border/20 last:border-b-0">
                        <td className="py-3.5 pr-4">
                          <div className="font-medium">{item.itemName}</div>
                          <div className="text-xs text-muted-foreground">{item.category}</div>
                        </td>
                        <td className="py-3.5 pr-4">
                          {item.variant ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/15 font-normal">
                              {item.variant}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/60">Standard</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right font-mono tabular-nums">{item.qty}</td>
                        <td className="py-3.5 text-right font-mono tabular-nums">{formatCurrency(item.costPrice, currency)}</td>
                        <td className="py-3.5 text-right font-mono tabular-nums">{formatCurrency(item.totalCost, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  <div>
                    <h3 className="text-base font-heading font-semibold">Money Summary</h3>
                    <p className="text-xs text-muted-foreground">Status and profit breakdown.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <PaymentStatusBadge sale={sale} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Sold for</span>
                    <span className="font-mono font-semibold">{formatCurrency(sale.totalSoldPrice, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Items cost</span>
                    <span className="font-mono font-semibold">{formatCurrency(totalCost, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Expenses</span>
                    <span className="font-mono font-semibold">{formatCurrency(expensesTotal, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Net Profit</span>
                    <span className={`font-mono font-semibold ${sale.profit > 0 ? "text-profit" : sale.profit < 0 ? "text-loss" : ""}`}>
                      {formatCurrency(sale.profit, currency)}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-violet-400" />
                  <div>
                    <h3 className="text-base font-heading font-semibold">Sale info</h3>
                    <p className="text-xs text-muted-foreground">Customer, date, and notes.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Date</p>
                      <p className="text-sm font-medium">{format(new Date(`${sale.date}T12:00:00`), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Customer</p>
                      <p className="text-sm font-medium">{sale.customerName || "No customer name"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Payment note</p>
                      <p className="text-sm font-medium">
                        {sale.paymentStatus === "half-paid"
                          ? `Still due ${formatCurrency(sale.amountDue || 0, currency)}`
                          : sale.paymentStatus === "unpaid"
                            ? "Full amount is unpaid"
                            : "This sale is paid"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <StickyNote className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Note</p>
                      <p className="text-sm font-medium whitespace-pre-wrap break-words">{sale.note || "No note added"}</p>
                    </div>
                  </div>
                </div>
              </section>

              {expenses.length > 0 ? (
                <section className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-amber-400" />
                    <div>
                      <h3 className="text-base font-heading font-semibold">Extra expenses</h3>
                      <p className="text-xs text-muted-foreground">Expenses added to this sale.</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                        <span className="text-sm text-foreground">{expense.label}</span>
                        <span className="font-mono text-sm font-semibold">{formatCurrency(expense.amount, currency)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
