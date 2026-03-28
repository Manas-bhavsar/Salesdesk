import { useState } from "react"
import { Item, Variant } from "@/types"
import { useItemsStore } from "@/store/useItemsStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { VariantBuilder } from "./VariantBuilder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check } from "lucide-react"

export function AddItemForm({ onSuccess }: { onSuccess?: () => void }) {
  const addItem = useItemsStore(state => state.addItem)
  const categories = useStoreConfig(state => state.config.categories)
  
  const [name, setName] = useState("")
  const [category, setCategory] = useState(categories[0] || "")
  const [sku, setSku] = useState("")
  const [sellPrice, setSellPrice] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState<Variant[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (hasVariants && variants.length === 0) return

    const newItem: Item = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category: category || categories[0] || "Uncategorized",
      sku: sku.trim(),
      hasVariants,
      variants: hasVariants ? variants : [],
      sellPrice: hasVariants ? 0 : parseFloat(sellPrice) || 0,
      costPrice: hasVariants ? 0 : parseFloat(costPrice) || 0,
      createdAt: Date.now()
    }

    addItem(newItem)

    setName("")
    setSku("")
    setSellPrice("")
    setCostPrice("")
    setHasVariants(false)
    setVariants([])
    if (onSuccess) onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5 md:p-6 border border-border/40 rounded-2xl bg-card/80 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="itemName">Item Name <span className="text-destructive">*</span></Label>
          <Input id="itemName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wireless Mouse" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="itemCategory">Category</Label>
          <select
            id="itemCategory"
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
          <Label htmlFor="itemSku">SKU <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input id="itemSku" value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. WM-001" />
        </div>
      </div>

      <div className="flex items-center space-x-3 pt-1">
        <button
          type="button"
          role="switch"
          aria-checked={hasVariants}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${hasVariants ? 'bg-primary' : 'bg-border'}`}
          onClick={() => setHasVariants(!hasVariants)}
        >
          <span className={`pointer-events-none block h-4.5 w-4.5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${hasVariants ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
        </button>
        <Label className="cursor-pointer select-none" onClick={() => setHasVariants(!hasVariants)}>
          This item has variants (sizes, colors, etc.)
        </Label>
      </div>

      {!hasVariants ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <Label htmlFor="sellPrice">Sell Price</Label>
            <Input id="sellPrice" type="number" min="0" step="0.01" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPrice">Cost Price</Label>
            <Input id="costPrice" type="number" min="0" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0.00" />
          </div>
        </div>
      ) : (
        <div className="pt-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <VariantBuilder variants={variants} onChange={setVariants} />
        </div>
      )}

      <div className="pt-3 flex justify-end">
        <Button type="submit" disabled={!name.trim() || (hasVariants && variants.length === 0)}>
          <Check className="h-4 w-4" />
          Add to catalog
        </Button>
      </div>
    </form>
  )
}
