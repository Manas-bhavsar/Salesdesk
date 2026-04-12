import { useMemo, useState } from "react"
import { format } from "date-fns"
import { ArrowRight, Check, CreditCard, Package2, Plus, Receipt, Trash2, User, Wallet } from "lucide-react"
import { useItemsStore } from "@/store/useItemsStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { formatCurrency } from "@/lib/calculations"
import { getSaleExpenses, getSaleLineItems } from "@/lib/sales"
import { PaymentStatus, Sale, SaleExpense, SaleLineItem } from "@/types"
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type SaleFormProps = {
  sale?: Sale
  title: string
  submitLabel: string
  submitIcon: "arrow" | "check"
  accentClassName: string
  onOpenChange: (open: boolean) => void
  onSubmitSale: (sale: Sale) => void
}

type LineItemDraft = {
  id: string
  itemId: string
  variantId: string
  qty: string
}

type ExpenseDraft = {
  id: string
  label: string
  amount: string
}

function createEmptyLineItemDraft(): LineItemDraft {
  return {
    id: crypto.randomUUID(),
    itemId: "",
    variantId: "",
    qty: "1",
  }
}

function createEmptyExpenseDraft(): ExpenseDraft {
  return {
    id: crypto.randomUUID(),
    label: "",
    amount: "",
  }
}

export function SaleForm({
  sale,
  title,
  submitLabel,
  submitIcon,
  accentClassName,
  onOpenChange,
  onSubmitSale,
}: SaleFormProps) {
  const items = useItemsStore(state => state.items)
  const currency = useStoreConfig(state => state.config.currency)

  const initialLineDrafts = useMemo<LineItemDraft[]>(() => {
    if (!sale) return [createEmptyLineItemDraft()]

    return getSaleLineItems(sale).map(lineItem => {
      const item = items.find(entry => entry.id === lineItem.itemId)
      const variantId =
        item?.hasVariants && lineItem.variant
          ? item.variants.find(variant => variant.name === lineItem.variant)?.id || ""
          : ""

      return {
        id: lineItem.id,
        itemId: lineItem.itemId,
        variantId,
        qty: lineItem.qty.toString(),
      }
    })
  }, [sale, items])

  const initialExpenseDrafts = useMemo<ExpenseDraft[]>(() => {
    if (!sale) return []

    return getSaleExpenses(sale).map(expense => ({
      id: expense.id,
      label: expense.label,
      amount: expense.amount.toString(),
    }))
  }, [sale])

  const [lineItemDrafts, setLineItemDrafts] = useState<LineItemDraft[]>(initialLineDrafts)
  const [expenseDrafts, setExpenseDrafts] = useState<ExpenseDraft[]>(initialExpenseDrafts)
  const [totalSoldPrice, setTotalSoldPrice] = useState(sale?.totalSoldPrice ? sale.totalSoldPrice.toString() : "")
  const [date, setDate] = useState(sale?.date ?? format(new Date(), "yyyy-MM-dd"))
  const [customerName, setCustomerName] = useState(sale?.customerName ?? "")
  const [note, setNote] = useState(sale?.note ?? "")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(sale?.paymentStatus ?? "paid")
  const [amountDue, setAmountDue] = useState(sale?.amountDue ? sale.amountDue.toString() : "")

  const computedLineItems = lineItemDrafts.map((draft) => {
    const item = items.find(entry => entry.id === draft.itemId)
    const effectiveVariantId = item?.hasVariants ? draft.variantId || item.variants[0]?.id || "" : ""
    const variant = item?.variants.find(entry => entry.id === effectiveVariantId)
    const quantity = parseInt(draft.qty) || 0
    const costPrice = item?.hasVariants ? (variant?.costPrice || 0) : (item?.costPrice || 0)
    const totalCost = costPrice * quantity

    return {
      draft,
      item,
      variant,
      effectiveVariantId,
      quantity,
      costPrice,
      totalCost,
    }
  })

  const validLineItems = computedLineItems.filter(({ item, variant, quantity }) => {
    if (!item || quantity <= 0) return false
    if (item.hasVariants && !variant) return false
    return true
  })

  const validExpenses = expenseDrafts
    .map((expense): SaleExpense | null => {
      const amount = parseFloat(expense.amount) || 0
      if (!expense.label.trim() || amount <= 0) return null

      return {
        id: expense.id,
        label: expense.label.trim(),
        amount,
      }
    })
    .filter((expense): expense is SaleExpense => expense !== null)

  const totalCost = validLineItems.reduce((sum, line) => sum + line.totalCost, 0)
  const parsedSoldPrice = parseFloat(totalSoldPrice) || 0
  const extraExpensesTotal = validExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const netProfit = parsedSoldPrice - totalCost - extraExpensesTotal
  const totalUnits = validLineItems.reduce((sum, line) => sum + line.quantity, 0)

  const isValid =
    validLineItems.length > 0 &&
    validLineItems.length === lineItemDrafts.length &&
    totalSoldPrice.trim() !== "" &&
    !isNaN(parsedSoldPrice) &&
    Boolean(date)

  const updateLineDraft = (id: string, updates: Partial<LineItemDraft>) => {
    setLineItemDrafts(prev => prev.map(draft => draft.id === id ? { ...draft, ...updates } : draft))
  }

  const updateExpenseDraft = (id: string, updates: Partial<ExpenseDraft>) => {
    setExpenseDrafts(prev => prev.map(expense => expense.id === id ? { ...expense, ...updates } : expense))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    const lineItems: SaleLineItem[] = validLineItems.map(({ draft, item, variant, quantity, costPrice, totalCost }) => ({
      id: draft.id,
      itemId: item!.id,
      itemName: item!.name,
      category: item!.category,
      variant: item!.hasVariants ? variant?.name || null : null,
      costPrice,
      qty: quantity,
      totalCost,
    }))

    const primaryLine = lineItems[0]

    onSubmitSale({
      id: sale?.id ?? crypto.randomUUID(),
      itemId: primaryLine.itemId,
      itemName: primaryLine.itemName,
      category: primaryLine.category,
      variant: lineItems.length === 1 ? primaryLine.variant : null,
      totalCost,
      totalSoldPrice: parsedSoldPrice,
      profit: netProfit,
      date,
      note: note.trim(),
      customerName: customerName.trim(),
      paymentStatus,
      amountDue: paymentStatus === "half-paid" ? (parseFloat(amountDue) || 0) : paymentStatus === "unpaid" ? parsedSoldPrice : 0,
      createdAt: sale?.createdAt ?? Date.parse(`${date}T12:00:00`),
      lineItems,
      expenses: validExpenses,
      extraExpensesTotal,
    })
  }

  return (
    <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto custom-scrollbar">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${accentClassName}`}>
              <Receipt className="h-4.5 w-4.5" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Bill Items</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setLineItemDrafts(prev => [...prev, createEmptyLineItemDraft()])}>
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            </div>

            <div className="space-y-3">
              {lineItemDrafts.map((draft) => {
                const line = computedLineItems.find(entry => entry.draft.id === draft.id)!

                return (
                  <div key={draft.id} className="rounded-xl border border-border/40 bg-surface/50 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">Item Info</span>
                      {lineItemDrafts.length > 1 ? (
                        <Button type="button" variant="ghost" size="icon" onClick={() => setLineItemDrafts(prev => prev.filter(entry => entry.id !== draft.id))} className="h-8 w-8 text-muted-foreground/50 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="space-y-2 md:col-span-6">
                        <Label>Item</Label>
                        <select
                          className="flex h-10 w-full rounded-lg border border-border/60 bg-card px-3.5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 hover:border-border"
                          value={draft.itemId}
                          onChange={(e) => updateLineDraft(draft.id, { itemId: e.target.value, variantId: "" })}
                        >
                          <option value="" disabled>Select an item...</option>
                          {items.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name} — {item.category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2 md:col-span-4">
                        <Label>Variant</Label>
                        <select
                          className="flex h-10 w-full rounded-lg border border-border/60 bg-card px-3.5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 hover:border-border disabled:opacity-50"
                          value={line.effectiveVariantId}
                          onChange={(e) => updateLineDraft(draft.id, { variantId: e.target.value })}
                          disabled={!line.item?.hasVariants}
                        >
                          <option value="" disabled>{line.item?.hasVariants ? "Select a variant..." : "No variants"}</option>
                          {line.item?.variants.map(variant => (
                            <option key={variant.id} value={variant.id}>
                              {variant.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Qty</Label>
                        <Input type="number" min="1" step="1" value={draft.qty} onChange={e => updateLineDraft(draft.id, { qty: e.target.value })} />
                      </div>
                    </div>

                    {line.item ? (
                      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/30 bg-card px-3 py-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Unit Cost</div>
                          <div className="font-mono text-sm">{formatCurrency(line.costPrice, currency)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Line Total Cost</div>
                          <div className="font-mono text-sm font-semibold">{formatCurrency(line.totalCost, currency)}</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Sale Summary</h3>
              </div>
              <div className="rounded-xl border border-border/40 bg-surface/50 p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Total Sold Price <span className="text-destructive">*</span></Label>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={totalSoldPrice} 
                    onChange={e => setTotalSoldPrice(e.target.value)} 
                    placeholder="0.00" 
                    required 
                    className="text-lg font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">The actual amount you sold all these items for.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Extra Expenses</h3>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setExpenseDrafts(prev => [...prev, createEmptyExpenseDraft()])}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {expenseDrafts.map((expense) => (
                  <div key={expense.id} className="rounded-xl border border-border/40 bg-surface/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase">Label</Label>
                          <Input
                            placeholder="Expense label"
                            value={expense.label}
                            onChange={e => updateExpenseDraft(expense.id, { label: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase">Amount</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={expense.amount}
                            onChange={e => updateExpenseDraft(expense.id, { amount: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setExpenseDrafts(prev => prev.filter(entry => entry.id !== expense.id))} className="h-8 w-8 mt-4 text-muted-foreground/50 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="saleDate">Date</Label>
              <Input id="saleDate" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input id="customerName" className="pl-9" placeholder="e.g. John Doe" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saleNote">Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="saleNote" placeholder="Order ref, special instructions..." value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Payment Status</Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["paid", "half-paid", "unpaid"] as PaymentStatus[]).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setPaymentStatus(status)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 capitalize ${
                    paymentStatus === status
                      ? status === "paid"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm"
                        : status === "half-paid"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-sm"
                          : "bg-red-500/15 text-red-400 border-red-500/30 shadow-sm"
                      : "bg-surface border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {status === "half-paid" ? "Half Paid" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {paymentStatus === "half-paid" ? (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-1.5 pt-1">
                <Label htmlFor="amountDue" className="text-xs text-muted-foreground">Amount remaining to be paid</Label>
                <Input
                  id="amountDue"
                  type="number"
                  min="0"
                  step="0.01"
                  max={parsedSoldPrice}
                  value={amountDue}
                  onChange={e => setAmountDue(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-surface rounded-xl border border-border/40">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Total Cost</div>
              <div className="font-mono text-sm">{formatCurrency(totalCost, currency)}</div>
              <div className="text-xs text-muted-foreground">{totalUnits} units</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Sold Price</div>
              <div className="font-mono text-sm font-semibold">{formatCurrency(parsedSoldPrice, currency)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Expenses</div>
              <div className="font-mono text-sm">{formatCurrency(extraExpensesTotal, currency)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Net Profit</div>
              <div className={`font-mono text-sm font-semibold ${netProfit > 0 ? "text-profit" : netProfit < 0 ? "text-loss" : ""}`}>
                {formatCurrency(netProfit, currency)}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={!isValid}>
            {submitIcon === "check" ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
