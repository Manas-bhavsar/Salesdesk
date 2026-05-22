import { useState } from "react"
import { Sale, PaymentRecord } from "@/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStoreConfig } from "@/store/useStoreConfig"
import { useSalesStore } from "@/store/useSalesStore"
import { formatCurrency } from "@/lib/calculations"
import { getSaleExpenses, getSaleExpensesTotal, getSaleLineItems, getSaleTotalCost, getSaleTotalUnits } from "@/lib/sales"
import { CalendarDays, CreditCard, Package2, Pencil, Plus, Receipt, StickyNote, Trash2, User, Wallet, History, IndianRupee, CheckCircle2 } from "lucide-react"
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

// ─── Payment History Section ───

function PaymentTimeline({
  sale,
  onRecordPayment,
  onEditPayment,
  onDeletePayment,
}: {
  sale: Sale
  onRecordPayment: (payment: { amount: number; date: string; note: string }) => void
  onEditPayment: (id: string, payment: { amount: number; date: string; note: string }) => void
  onDeletePayment: (id: string) => void
}) {
  const currency = useStoreConfig(state => state.config.currency)
  const [showForm, setShowForm] = useState(false)
  const [payAmount, setPayAmount] = useState("")
  const [payDate, setPayDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [payNote, setPayNote] = useState("")

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editNote, setEditNote] = useState("")

  const records = sale.paymentRecords || []
  const totalPaid = records.reduce((sum, r) => sum + r.amount, 0)
  const totalDue = sale.amountDue || 0
  const totalSold = sale.totalSoldPrice
  const progressPercent = totalSold > 0 ? Math.min(100, ((totalSold - totalDue) / totalSold) * 100) : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) return

    onRecordPayment({
      amount,
      date: payDate,
      note: payNote.trim(),
    })

    // Reset form
    setPayAmount("")
    setPayNote("")
    setPayDate(format(new Date(), "yyyy-MM-dd"))
    setShowForm(false)
  }

  const startEdit = (record: PaymentRecord) => {
    setEditingId(record.id)
    setEditAmount(record.amount.toString())
    setEditDate(record.date)
    setEditNote(record.note)
    setShowForm(false) // close add form if open
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditAmount("")
    setEditDate("")
    setEditNote("")
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    const amount = parseFloat(editAmount)
    if (!amount || amount <= 0) return

    onEditPayment(editingId, {
      amount,
      date: editDate,
      note: editNote.trim(),
    })
    cancelEdit()
  }

  const handleDelete = (id: string) => {
    onDeletePayment(id)
    if (editingId === id) cancelEdit()
  }

  return (
    <section className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-amber-400" />
          <div>
            <h3 className="text-base font-heading font-semibold">Payment History</h3>
            <p className="text-xs text-muted-foreground">Track partial payments over time.</p>
          </div>
        </div>
        {sale.paymentStatus !== "paid" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { setShowForm(!showForm); cancelEdit() }}
            className="h-7 text-[10px] px-2.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
          >
            <Plus className="h-3 w-3 mr-1" />
            Record Payment
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Paid {formatCurrency(totalSold - totalDue, currency)} of {formatCurrency(totalSold, currency)}
          </span>
          <span className="font-mono font-semibold text-amber-400">
            {progressPercent.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-border/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              background: progressPercent >= 100
                ? "linear-gradient(90deg, #34d399, #10b981)"
                : "linear-gradient(90deg, #fbbf24, #f59e0b)",
            }}
          />
        </div>
        {totalDue > 0 && (
          <p className="text-xs text-amber-400/80">
            {formatCurrency(totalDue, currency)} remaining
          </p>
        )}
      </div>

      {/* Record Payment Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 font-mono text-xs">
                  {currency}
                </div>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={totalDue}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="h-9 pl-8 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Note (optional)</Label>
            <Input
              value={payNote}
              onChange={e => setPayNote(e.target.value)}
              placeholder="e.g. Cash payment, UPI, etc."
              className="h-9 text-sm"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-8 text-xs text-muted-foreground">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black shadow-md shadow-amber-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Save Payment
            </Button>
          </div>
        </form>
      )}

      {/* Payment Records List */}
      {records.length > 0 ? (
        <div className="mt-4 space-y-2">
          {[...records]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((record, idx) => (
              <div key={record.id}>
                {editingId === record.id ? (
                  /* ── Inline Edit Form ── */
                  <form
                    onSubmit={handleEditSubmit}
                    className="p-4 rounded-xl border border-primary/25 bg-primary/5 space-y-3 animate-in fade-in duration-200"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 font-mono text-xs">
                            {currency}
                          </div>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            className="h-9 pl-8 text-sm"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Date</Label>
                        <Input
                          type="date"
                          value={editDate}
                          onChange={e => setEditDate(e.target.value)}
                          className="h-9 text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Note (optional)</Label>
                      <Input
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        placeholder="e.g. Cash payment, UPI, etc."
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button type="button" variant="ghost" size="sm" onClick={cancelEdit} className="h-8 text-xs text-muted-foreground">
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="h-8 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Update
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* ── Payment Record Row ── */
                  <div
                    className="group flex items-start gap-3 rounded-xl border border-border/40 bg-background/35 px-4 py-3 animate-in fade-in duration-300"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-semibold text-sm text-emerald-400">
                          +{formatCurrency(record.amount, currency)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(`${record.date}T12:00:00`), "MMM d, yyyy")}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              type="button"
                              onClick={() => startEdit(record)}
                              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all duration-200"
                              title="Edit payment"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(record.id)}
                              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                              title="Delete payment"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {record.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{record.note}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="mt-4 py-4 text-center border border-dashed border-border/40 rounded-xl bg-surface/10">
          <p className="text-[11px] text-muted-foreground">No payments recorded yet.</p>
          {sale.paymentStatus !== "paid" && (
            <p className="text-[10px] text-muted-foreground/60 mt-1">Click &quot;Record Payment&quot; to add one.</p>
          )}
        </div>
      )}
    </section>
  )
}

// ─── Main Modal ───

interface SaleDetailsModalProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaleDetailsModal({ sale, open, onOpenChange }: SaleDetailsModalProps) {
  const currency = useStoreConfig(state => state.config.currency)
  const updateSale = useSalesStore(state => state.updateSale)
  const liveSales = useSalesStore(state => state.sales)

  if (!sale) return null

  // Read live sale from the store to keep the modal in sync after recording payments
  const liveSale = liveSales.find(s => s.id === sale.id) || sale

  const lineItems = getSaleLineItems(liveSale)
  const expenses = getSaleExpenses(liveSale)
  const totalCost = getSaleTotalCost(liveSale)
  const expensesTotal = getSaleExpensesTotal(liveSale)
  const totalUnits = getSaleTotalUnits(liveSale)

  const recalcAndSave = (updatedRecords: PaymentRecord[]) => {
    const totalPaidNow = updatedRecords.reduce((sum, r) => sum + r.amount, 0)
    const newAmountDue = Math.max(0, liveSale.totalSoldPrice - totalPaidNow)
    const newStatus = newAmountDue <= 0 ? "paid" : totalPaidNow > 0 ? "half-paid" : "unpaid"

    updateSale(liveSale.id, {
      ...liveSale,
      paymentRecords: updatedRecords,
      amountDue: newAmountDue,
      paymentStatus: newStatus as Sale["paymentStatus"],
    })
  }

  const handleRecordPayment = (payment: { amount: number; date: string; note: string }) => {
    const newRecord: PaymentRecord = {
      id: crypto.randomUUID(),
      amount: payment.amount,
      date: payment.date,
      note: payment.note,
    }
    recalcAndSave([...(liveSale.paymentRecords || []), newRecord])
  }

  const handleEditPayment = (id: string, payment: { amount: number; date: string; note: string }) => {
    const updatedRecords = (liveSale.paymentRecords || []).map(r =>
      r.id === id ? { ...r, amount: payment.amount, date: payment.date, note: payment.note } : r
    )
    recalcAndSave(updatedRecords)
  }

  const handleDeletePayment = (id: string) => {
    const updatedRecords = (liveSale.paymentRecords || []).filter(r => r.id !== id)
    recalcAndSave(updatedRecords)
  }

  const showPaymentHistory = liveSale.paymentStatus === "half-paid" || liveSale.paymentStatus === "unpaid" || (liveSale.paymentRecords && liveSale.paymentRecords.length > 0)

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
                <PaymentStatusBadge sale={liveSale} />
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
              value={formatCurrency(liveSale.totalSoldPrice, currency)}
              sub={`${totalUnits} items`}
            />
            <DetailCard
              label="Net Profit"
              value={formatCurrency(liveSale.profit, currency)}
              sub={liveSale.totalSoldPrice > 0 ? `${((liveSale.profit / liveSale.totalSoldPrice) * 100).toFixed(1)}% margin` : undefined}
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
            <div className="space-y-6">
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

              {/* Payment History - only shown for unpaid/half-paid or if there are records */}
              {showPaymentHistory && (
                <PaymentTimeline sale={liveSale} onRecordPayment={handleRecordPayment} onEditPayment={handleEditPayment} onDeletePayment={handleDeletePayment} />
              )}
            </div>

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
                    <PaymentStatusBadge sale={liveSale} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Sold for</span>
                    <span className="font-mono font-semibold">{formatCurrency(liveSale.totalSoldPrice, currency)}</span>
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
                    <span className={`font-mono font-semibold ${liveSale.profit > 0 ? "text-profit" : liveSale.profit < 0 ? "text-loss" : ""}`}>
                      {formatCurrency(liveSale.profit, currency)}
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
                      <p className="text-sm font-medium">{format(new Date(`${liveSale.date}T12:00:00`), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Customer</p>
                      <p className="text-sm font-medium">{liveSale.customerName || "No customer name"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Payment note</p>
                      <p className="text-sm font-medium">
                        {liveSale.paymentStatus === "half-paid"
                          ? `Still due ${formatCurrency(liveSale.amountDue || 0, currency)}`
                          : liveSale.paymentStatus === "unpaid"
                            ? "Full amount is unpaid"
                            : "This sale is paid"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/35 px-4 py-3">
                    <StickyNote className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Note</p>
                      <p className="text-sm font-medium whitespace-pre-wrap break-words">{liveSale.note || "No note added"}</p>
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
