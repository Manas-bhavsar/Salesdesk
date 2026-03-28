import { useState } from "react"
import { useItemsStore } from "@/store/useItemsStore"
import { useSalesStore } from "@/store/useSalesStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { calcTotal, calcProfit, formatCurrency } from "@/lib/calculations"
import { Sale, PaymentStatus } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Check, User, CreditCard } from "lucide-react"

interface EditSaleModalProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditSaleModal({ sale, open, onOpenChange, onSuccess }: EditSaleModalProps) {
  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <EditSaleForm
          key={sale.id}
          sale={sale}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      ) : null}
    </Dialog>
  )
}

function EditSaleForm({
  sale,
  onOpenChange,
  onSuccess,
}: {
  sale: Sale
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const items = useItemsStore(state => state.items)
  const updateSale = useSalesStore(state => state.updateSale)
  const currency = useStoreConfig(state => state.config.currency)

  const initialVariantId = (() => {
    const item = items.find(entry => entry.id === sale.itemId)
    if (!item?.hasVariants || !sale.variant) return ""
    return item.variants.find(variant => variant.name === sale.variant)?.id || ""
  })()

  const [selectedItemId, setSelectedItemId] = useState(sale.itemId)
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId)
  const [qty, setQty] = useState(sale.qty.toString())
  const [date, setDate] = useState(sale.date)
  const [customerName, setCustomerName] = useState(sale.customerName || "")
  const [note, setNote] = useState(sale.note)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(sale.paymentStatus || "paid")
  const [amountDue, setAmountDue] = useState(sale.amountDue ? sale.amountDue.toString() : "")

  const selectedItem = items.find(item => item.id === selectedItemId)
  const effectiveVariantId = selectedItem?.hasVariants ? selectedVariantId || selectedItem.variants[0]?.id || "" : ""
  const selectedVariant = selectedItem?.variants.find(variant => variant.id === effectiveVariantId)

  const sellPrice = selectedItem?.hasVariants ? (selectedVariant?.sellPrice || 0) : (selectedItem?.sellPrice || 0)
  const costPrice = selectedItem?.hasVariants ? (selectedVariant?.costPrice || 0) : (selectedItem?.costPrice || 0)
  const quantity = parseInt(qty) || 0

  const totalRev = calcTotal(sellPrice, quantity)
  const totalProf = calcProfit(sellPrice, costPrice, quantity)

  const isValid = selectedItem && (!selectedItem.hasVariants || selectedVariant) && quantity > 0 && date

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !selectedItem) return

    const updatedSale: Sale = {
      ...sale,
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
      amountDue: paymentStatus === "half-paid" ? (parseFloat(amountDue) || 0) : paymentStatus === "unpaid" ? totalRev : 0,
    }

    updateSale(sale.id, updatedSale)
    onOpenChange(false)
    if (onSuccess) onSuccess()
  }

  return (
    <DialogContent className="sm:max-w-[520px]">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Pencil className="h-4 w-4 text-blue-400" />
            </div>
            <DialogTitle className="text-xl">Edit Sale</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-6">
          <div className="space-y-2">
            <Label htmlFor="editSaleItem">Item</Label>
            <select
              id="editSaleItem"
              className="flex h-10 w-full rounded-lg border border-border/60 bg-surface px-3.5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 hover:border-border"
              value={selectedItemId}
              onChange={e => {
                setSelectedItemId(e.target.value)
                setSelectedVariantId("")
              }}
            >
              <option value="" disabled>Select an item...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.category}
                </option>
              ))}
              {!items.find(item => item.id === sale.itemId) && (
                <option value={sale.itemId} disabled>
                  {sale.itemName} (deleted)
                </option>
              )}
            </select>
          </div>

          {selectedItem?.hasVariants && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="editSaleVariant">Variant</Label>
              <select
                id="editSaleVariant"
                className="flex h-10 w-full rounded-lg border border-border/60 bg-surface px-3.5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 hover:border-border"
                value={effectiveVariantId}
                onChange={e => setSelectedVariantId(e.target.value)}
              >
                <option value="" disabled>Select a variant...</option>
                {selectedItem.variants.map(variant => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} — {formatCurrency(variant.sellPrice, currency)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editSaleQty">Quantity</Label>
              <Input id="editSaleQty" type="number" min="1" step="1" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSaleDate">Date</Label>
              <Input id="editSaleDate" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editSaleCustomer">Customer Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input id="editSaleCustomer" className="pl-9" placeholder="e.g. John Doe" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editSaleNote">Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="editSaleNote" placeholder="Order ref, special instructions..." value={note} onChange={e => setNote(e.target.value)} />
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

            {paymentStatus === "half-paid" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-1.5 pt-1">
                <Label htmlFor="editAmountDue" className="text-xs text-muted-foreground">Amount remaining to be paid</Label>
                <Input
                  id="editAmountDue"
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
            <Check className="h-4 w-4" />
            Save changes
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
