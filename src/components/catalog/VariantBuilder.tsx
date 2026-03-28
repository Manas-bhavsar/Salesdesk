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
  const [sellPrice, setSellPrice] = useState("")
  const [costPrice, setCostPrice] = useState("")

  const addVariant = () => {
    if (!name.trim() || !sellPrice) return
    const newVariant: Variant = {
      id: crypto.randomUUID(),
      name: name.trim(),
      sellPrice: parseFloat(sellPrice) || 0,
      costPrice: parseFloat(costPrice) || 0,
    }
    onChange([...variants, newVariant])
    setName("")
    setSellPrice("")
    setCostPrice("")
  }

  const removeVariant = (id: string) => {
    onChange(variants.filter(v => v.id !== id))
  }

  return (
    <div className="space-y-4 p-4 border border-border/40 rounded-xl bg-surface/50">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Item Variants</Label>
        <span className="text-xs text-muted-foreground bg-surface px-2 py-0.5 rounded-full border border-border/40">
          {variants.length} added
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs text-muted-foreground">Name (e.g. Small, Red)</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Variant name" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Sell Price</Label>
          <Input type="number" min="0" step="0.01" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="0.00" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Cost Price</Label>
          <div className="flex gap-2">
            <Input type="number" min="0" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0.00" className="h-9" />
            <Button type="button" size="icon" className="h-9 w-9 shrink-0" onClick={addVariant} disabled={!name.trim() || !sellPrice}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {variants.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t border-border/30">
          {variants.map((v) => (
            <div key={v.id} className="flex items-center justify-between bg-card p-2.5 px-3.5 rounded-lg border border-border/30 text-sm transition-all duration-200 hover:border-border/60">
              <span className="font-medium">{v.name}</span>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="font-mono text-xs">Sell: {v.sellPrice}</span>
                <span className="font-mono text-xs">Cost: {v.costPrice}</span>
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
