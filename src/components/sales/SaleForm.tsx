import { useEffect, useMemo, useState, useRef } from "react"
import { format } from "date-fns"
import { ArrowRight, Check, CreditCard, Package2, Plus, Receipt, Trash2, User, Wallet, Calculator } from "lucide-react"
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
  const lastItemSelectRef = useRef<HTMLSelectElement>(null)

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

  // Auto-add new row when last row is filled
  useEffect(() => {
    const lastItem = lineItemDrafts[lineItemDrafts.length - 1]
    if (lastItem && lastItem.itemId) {
      setLineItemDrafts(prev => [...prev, createEmptyLineItemDraft()])
    }
  }, [lineItemDrafts])

  // Focus the last row's item selector when it's empty and was just added
  useEffect(() => {
    if (lastItemSelectRef.current && lineItemDrafts.length > initialLineDrafts.length) {
      const lastItem = lineItemDrafts[lineItemDrafts.length - 1]
      if (!lastItem.itemId) {
        lastItemSelectRef.current.focus()
      }
    }
  }, [lineItemDrafts.length, initialLineDrafts.length])

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

  const validLineItems = computedLineItems.filter(({ item, quantity }) => {
    if (!item || quantity <= 0) return false
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

    // Baseline calculation to distribute the parsedSoldPrice among items
    const baseLineItems = validLineItems.map(({ item, variant, quantity, costPrice, totalCost }) => {
      const defaultSellPrice = item?.hasVariants ? (variant?.sellPrice || 0) : (item?.sellPrice || 0)
      const weight = (defaultSellPrice || costPrice || 1) * quantity
      return { item, variant, quantity, costPrice, totalCost, weight }
    })

    const totalWeight = baseLineItems.reduce((sum, line) => sum + line.weight, 0)

    const lineItems: SaleLineItem[] = baseLineItems.map(({ item, variant, quantity, costPrice, totalCost, weight }) => {
      // Pro-rate the total sold price across items based on their weight
      const lineRevenue = totalWeight > 0 ? (weight / totalWeight) * parsedSoldPrice : (parsedSoldPrice / baseLineItems.length)
      const sellPrice = lineRevenue / quantity

      return {
        id: crypto.randomUUID(),
        itemId: item!.id,
        itemName: item!.name,
        category: item!.category,
        variant: item!.hasVariants ? variant?.name || null : null,
        costPrice,
        sellPrice,
        qty: quantity,
        totalCost,
      }
    })

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
    <DialogContent className="sm:max-w-[840px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${accentClassName}`}>
              <Receipt className="h-4.5 w-4.5" />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-8">
          {/* Bill Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Bill Items</h3>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {validLineItems.length} active items
              </span>
            </div>

            <div className="border border-border/40 rounded-xl overflow-hidden bg-surface/30">
              <div className="grid grid-cols-[1fr_180px_100px_120px_40px] gap-2 px-4 py-2 bg-surface/60 border-b border-border/40 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                <div>Item</div>
                <div>Variant</div>
                <div className="text-center">Qty</div>
                <div className="text-right">Cost</div>
                <div></div>
              </div>
              
              <div className="divide-y divide-border/20">
                {lineItemDrafts.map((draft, index) => {
                  const line = computedLineItems.find(entry => entry.draft.id === draft.id)!
                  const isLast = index === lineItemDrafts.length - 1

                  return (
                    <div 
                      key={draft.id} 
                      className="grid grid-cols-[1fr_180px_100px_120px_40px] gap-2 px-4 py-3 items-center group transition-colors hover:bg-surface/40"
                    >
                      <div>
                        <select
                          ref={isLast ? lastItemSelectRef : null}
                          className="flex h-9 w-full rounded-lg border border-border/60 bg-card px-2 py-1 text-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/50"
                          value={draft.itemId}
                          onChange={(e) => updateLineDraft(draft.id, { itemId: e.target.value, variantId: "" })}
                        >
                          <option value="" disabled>Select item...</option>
                          {items.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <select
                          className="flex h-9 w-full rounded-lg border border-border/60 bg-card px-2 py-1 text-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed"
                          value={line.effectiveVariantId}
                          onChange={(e) => updateLineDraft(draft.id, { variantId: e.target.value })}
                          disabled={!line.item?.hasVariants}
                        >
                          <option value="" disabled>{line.item?.hasVariants ? "Select..." : "—"}</option>
                          {line.item?.variants.map(variant => (
                            <option key={variant.id} value={variant.id}>
                              {variant.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="px-2">
                        <Input 
                          type="number" 
                          min="1" 
                          step="1" 
                          value={draft.qty} 
                          onChange={e => updateLineDraft(draft.id, { qty: e.target.value })} 
                          className="h-9 text-center"
                        />
                      </div>

                      <div className="text-right font-mono text-sm pr-2">
                        {line.item ? formatCurrency(line.totalCost, currency) : "—"}
                      </div>

                      <div className="flex justify-end">
                        {!isLast && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setLineItemDrafts(prev => prev.filter(entry => entry.id !== draft.id))} 
                            className="h-8 w-8 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <p className="text-[11px] text-muted-foreground italic px-1">
              * A new row is added automatically when you select an item.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sale Summary & Financials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Financial Details</h3>
              </div>
              
              <div className="space-y-4 p-5 rounded-2xl border border-border/40 bg-surface/20">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Sold Price</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 font-mono text-sm">
                      {currency}
                    </div>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={totalSoldPrice} 
                      onChange={e => setTotalSoldPrice(e.target.value)} 
                      placeholder="0.00" 
                      required 
                      className="pl-10 h-12 text-xl font-heading font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    <Label className="text-xs font-medium">Payment Status</Label>
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
                        {status === "half-paid" ? "Partial" : status}
                      </button>
                    ))}
                  </div>

                  {paymentStatus === "half-paid" ? (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-1">
                      <Label htmlFor="amountDue" className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Amount Due</Label>
                      <Input
                        id="amountDue"
                        type="number"
                        min="0"
                        step="0.01"
                        max={parsedSoldPrice}
                        value={amountDue}
                        onChange={e => setAmountDue(e.target.value)}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Extra Expenses</h3>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setExpenseDrafts(prev => [...prev, createEmptyExpenseDraft()])} className="h-7 text-[10px] px-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {expenseDrafts.map((expense) => (
                  <div key={expense.id} className="flex items-center gap-2 p-3 rounded-xl border border-border/40 bg-surface/20">
                    <Input
                      placeholder="Label"
                      value={expense.label}
                      onChange={e => updateExpenseDraft(expense.id, { label: e.target.value })}
                      className="h-8 text-xs flex-1"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={expense.amount}
                      onChange={e => updateExpenseDraft(expense.id, { amount: e.target.value })}
                      className="h-8 text-xs w-24"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setExpenseDrafts(prev => prev.filter(entry => entry.id !== expense.id))} className="h-8 w-8 text-muted-foreground/30 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {expenseDrafts.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-border/40 rounded-xl bg-surface/10">
                    <p className="text-[11px] text-muted-foreground">No extra expenses added.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/40">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="saleDate" className="text-xs font-medium">Sale Date</Label>
                <Input id="saleDate" type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-xs font-medium">Customer Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input id="customerName" className="pl-9 h-10" placeholder="Optional" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saleNote" className="text-xs font-medium">Internal Note</Label>
              <Input id="saleNote" placeholder="Reference, special terms..." value={note} onChange={e => setNote(e.target.value)} className="h-10" />
            </div>
          </div>
        </div>

        <div className="shrink-0 bg-surface/80 backdrop-blur-md border-t border-border/50 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-1">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-1">Items Cost</div>
                <div className="font-mono text-sm">{formatCurrency(totalCost, currency)}</div>
                <div className="text-[10px] text-muted-foreground">{totalUnits} units total</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-1">Expenses</div>
                <div className="font-mono text-sm">{formatCurrency(extraExpensesTotal, currency)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-1">Sold For</div>
                <div className="font-mono text-base font-bold text-foreground">{formatCurrency(parsedSoldPrice, currency)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mb-1">Net Profit</div>
                <div className={`font-mono text-base font-bold ${netProfit > 0 ? "text-emerald-400" : netProfit < 0 ? "text-rose-400" : "text-muted-foreground"}`}>
                  {formatCurrency(netProfit, currency)}
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-end gap-3 shrink-0">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" disabled={!isValid} size="lg" className="px-8 shadow-lg shadow-primary/20">
                {submitIcon === "check" ? <Check className="mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                {submitLabel}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </form>
    </DialogContent>
  )
}
