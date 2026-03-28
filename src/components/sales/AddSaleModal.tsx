import { useState, useEffect } from "react"
import { useItemsStore } from "@/store/useItemsStore"
import { useSalesStore } from "@/store/useSalesStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { useToast } from "@/components/ui/Toast"
import { calcTotal, calcProfit, formatCurrency } from "@/lib/calculations"
import { Sale, PaymentStatus } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { ShoppingBag, ArrowRight, User, CreditCard } from "lucide-react"

export function AddSaleModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const items = useItemsStore(state => state.items)
  const addSale = useSalesStore(state => state.addSale)
  const currency = useStoreConfig(state => state.config.currency)
  const { toast } = useToast()

  const [selectedItemId, setSelectedItemId] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [qty, setQty] = useState("1")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [customerName, setCustomerName] = useState("")
  const [note, setNote] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid")
  const [amountDue, setAmountDue] = useState("")

  useEffect(() => {
    if (open) {
      setSelectedItemId("")
      setSelectedVariantId("")
      setQty("1")
      setDate(format(new Date(), "yyyy-MM-dd"))
      setCustomerName("")
      setNote("")
      setPaymentStatus("paid")
      setAmountDue("")
    }
  }, [open])

  const selectedItem = items.find(i => i.id === selectedItemId)
  const selectedVariant = selectedItem?.variants.find(v => v.id === selectedVariantId)

  useEffect(() => {
    if (selectedItem && selectedItem.hasVariants && selectedItem.variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(selectedItem.variants[0].id)
    } else if (selectedItem && !selectedItem.hasVariants) {
      setSelectedVariantId("")
    }
  }, [selectedItem, selectedVariantId])

  const sellPrice = selectedItem?.hasVariants ? (selectedVariant?.sellPrice || 0) : (selectedItem?.sellPrice || 0)
  const costPrice = selectedItem?.hasVariants ? (selectedVariant?.costPrice || 0) : (selectedItem?.costPrice || 0)
  const quantity = parseInt(qty) || 0
  
  const totalRev = calcTotal(sellPrice, quantity)
  const totalProf = calcProfit(sellPrice, costPrice, quantity)

  const isValid = selectedItem && (!selectedItem.hasVariants || selectedVariant) && quantity > 0 && date

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !selectedItem) return

    const newSale: Sale = {
      id: crypto.randomUUID(),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      category: selectedItem.category,
      variant: selectedItem.hasVariants ? selectedVariant?.name || null : null,
      sellPrice,
      costPrice,
      qty: quantity,
      total: totalRev,
      profit: totalProf,
      date,
      note: note.trim(),
      customerName: customerName.trim(),
      paymentStatus,
      amountDue: paymentStatus === 'half-paid' ? (parseFloat(amountDue) || 0) : paymentStatus === 'unpaid' ? totalRev : 0,
      createdAt: Date.now()
    }

    addSale(newSale)
    toast("Sale recorded successfully")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <ShoppingBag className="h-4.5 w-4.5 text-primary" />
              </div>
              <DialogTitle className="text-xl">Record Sale</DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="itemSelect">Item</Label>
              <select
                id="itemSelect"
                className="flex h-10 w-full rounded-lg border border-border/60 bg-surface px-3.5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 hover:border-border"
                value={selectedItemId}
                onChange={e => setSelectedItemId(e.target.value)}
              >
                <option value="" disabled>Select an item...</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {item.category}
                  </option>
                ))}
              </select>
            </div>

            {selectedItem?.hasVariants && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="variantSelect">Variant</Label>
                <select
                  id="variantSelect"
                  className="flex h-10 w-full rounded-lg border border-border/60 bg-surface px-3.5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 hover:border-border"
                  value={selectedVariantId}
                  onChange={e => setSelectedVariantId(e.target.value)}
                >
                  <option value="" disabled>Select a variant...</option>
                  {selectedItem.variants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {formatCurrency(v.sellPrice, currency)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input id="qty" type="number" min="1" step="1" value={qty} onChange={e => setQty(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input id="customerName" className="pl-9" placeholder="e.g. John Doe" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="note" placeholder="Order ref, special instructions..." value={note} onChange={e => setNote(e.target.value)} />
            </div>

            {/* Payment Status */}
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
                        ? status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm'
                          : status === 'half-paid'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-sm'
                            : 'bg-red-500/15 text-red-400 border-red-500/30 shadow-sm'
                        : 'bg-surface border-border/40 text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    {status === 'half-paid' ? 'Half Paid' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {paymentStatus === 'half-paid' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-1.5 pt-1">
                  <Label htmlFor="amountDue" className="text-xs text-muted-foreground">Amount remaining to be paid</Label>
                  <Input
                    id="amountDue"
                    type="number"
                    min="0"
                    step="0.01"
                    max={totalRev}
                    value={amountDue}
                    onChange={e => setAmountDue(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {selectedItem && (
              <div className="grid grid-cols-3 gap-3 p-4 bg-surface rounded-xl border border-border/40 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Unit Price</div>
                  <div className="font-mono text-sm">{formatCurrency(sellPrice, currency)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Total Revenue</div>
                  <div className="font-mono text-sm font-semibold">{formatCurrency(totalRev, currency)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Profit</div>
                  <div className={`font-mono text-sm font-semibold ${totalProf > 0 ? "text-profit" : totalProf < 0 ? "text-loss" : ""}`}>
                    {formatCurrency(totalProf, currency)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!isValid}>
              Record sale
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
