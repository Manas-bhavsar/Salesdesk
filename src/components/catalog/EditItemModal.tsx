import { useState } from "react"
import { Item, Variant } from "@/types"
import { useItemsStore } from "@/store/useItemsStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { VariantBuilder } from "./VariantBuilder"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Check } from "lucide-react"

interface EditItemModalProps {
  item: Item | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditItemModal({ item, open, onOpenChange, onSuccess }: EditItemModalProps) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <EditItemForm
          key={item.id}
          item={item}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      ) : null}
    </Dialog>
  )
}

function EditItemForm({
  item,
  onOpenChange,
  onSuccess,
}: {
  item: Item
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const updateItem = useItemsStore(state => state.updateItem)
  const categories = useStoreConfig(state => state.config.categories)

  const [name, setName] = useState(item.name)
  const [category, setCategory] = useState(item.category)
  const [sku, setSku] = useState(item.sku)
  const [sellPrice, setSellPrice] = useState(item.sellPrice.toString())
  const [costPrice, setCostPrice] = useState(item.costPrice.toString())
  const [hasVariants, setHasVariants] = useState(item.hasVariants)
  const [variants, setVariants] = useState<Variant[]>(() => item.variants.map(variant => ({ ...variant })))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (hasVariants && variants.length === 0) return

    const updatedItem: Item = {
      ...item,
      name: name.trim(),
      category: category || categories[0] || "Uncategorized",
      sku: sku.trim(),
      hasVariants,
      variants: hasVariants ? variants : [],
      sellPrice: hasVariants ? 0 : parseFloat(sellPrice) || 0,
      costPrice: hasVariants ? 0 : parseFloat(costPrice) || 0,
    }

    updateItem(item.id, updatedItem)
    onOpenChange(false)
    if (onSuccess) onSuccess()
  }

  return (
    <DialogContent className="sm:max-w-[560px]">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Pencil className="h-4 w-4 text-amber-400" />
            </div>
            <DialogTitle className="text-xl">Edit Item</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="editItemName">Item Name <span className="text-destructive">*</span></Label>
              <Input id="editItemName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wireless Mouse" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editItemCategory">Category</Label>
              <select
                id="editItemCategory"
                className="flex h-10 w-full rounded-lg border border-border/60 bg-surface px-3.5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 hover:border-border"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="editItemSku">SKU <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="editItemSku" value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. WM-001" />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={hasVariants}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${hasVariants ? "bg-primary" : "bg-border"}`}
              onClick={() => setHasVariants(!hasVariants)}
            >
              <span className={`pointer-events-none block h-4.5 w-4.5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${hasVariants ? "translate-x-[22px]" : "translate-x-[3px]"}`} />
            </button>
            <Label className="cursor-pointer select-none" onClick={() => setHasVariants(!hasVariants)}>
              This item has variants (sizes, colors, etc.)
            </Label>
          </div>

          {!hasVariants ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Label htmlFor="editSellPrice">Sell Price</Label>
                <Input id="editSellPrice" type="number" min="0" step="0.01" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCostPrice">Cost Price</Label>
                <Input id="editCostPrice" type="number" min="0" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0.00" />
              </div>
            </div>
          ) : (
            <div className="pt-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <VariantBuilder variants={variants} onChange={setVariants} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={!name.trim() || (hasVariants && variants.length === 0)}>
            <Check className="h-4 w-4" />
            Save changes
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
