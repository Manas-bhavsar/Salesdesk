import { useState } from "react"
import { Variant } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus } from "lucide-react"

interface VariantBuilderProps {
  variants: Variant[]
  onChange: (variants: Variant[]) => void
}

export function VariantBuilder({ variants, onChange }: VariantBuilderProps) {
  const [name, setName] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [stockQuantity, setStockQuantity] = useState("")

  const addVariant = () => {
    if (!name.trim()) return
    const newVariant: Variant = {
      id: crypto.randomUUID(),
      name: name.trim(),
      // Sale price is entered when recording a sale (not stored in catalog).
      sellPrice: 0,
      costPrice: parseFloat(costPrice) || 0,
      stockQuantity: parseInt(stockQuantity, 10) || 0,
    }
    onChange([...variants, newVariant])
    setName("")
    setCostPrice("")
    setStockQuantity("")
  }

  const removeVariant = (id: string) => {
    onChange(variants.filter(v => v.id !== id))
  }

  const updateVariant = (id: string, updated: Partial<Variant>) => {
    onChange(variants.map(variant => variant.id === id ? { ...variant, ...updated } : variant))
  }

  return (
    <div className="space-y-4 p-4 border border-border/40 rounded-xl bg-surface/50">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Item Variants</Label>
        <span className="text-xs text-muted-foreground bg-surface px-2 py-0.5 rounded-full border border-border/40">
          {variants.length} added
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Name (e.g. Small, Red)</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Variant name" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Cost Price</Label>
          <Input type="number" min="0" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0.00" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Inventory Qty</Label>
          <Input type="number" min="0" step="1" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} placeholder="0" className="h-9" />
        </div>
        <Button type="button" size="icon" className="h-9 w-9 shrink-0" onClick={addVariant} disabled={!name.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-[11px] text-muted-foreground">
        Add each variant with its cost price and total stocked quantity. Sale price is entered when you record a sale.
      </div>

      {variants.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t border-border/30">
          {variants.map((v) => (
            <div key={v.id} className="grid grid-cols-1 gap-3 rounded-lg border border-border/30 bg-card p-3 transition-all duration-200 hover:border-border/60 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] md:items-end">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Variant Name</Label>
                <Input value={v.name} onChange={e => updateVariant(v.id, { name: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cost Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={v.costPrice}
                  onChange={e => updateVariant(v.id, { costPrice: parseFloat(e.target.value) || 0 })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Inventory Qty</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={v.stockQuantity}
                  onChange={e => updateVariant(v.id, { stockQuantity: parseInt(e.target.value, 10) || 0 })}
                  className="h-9"
                />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => removeVariant(v.id)} className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg p-1 transition-all duration-200">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
