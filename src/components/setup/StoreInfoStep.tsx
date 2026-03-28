import { useState } from "react"
import { useStoreConfig } from "@/store/useStoreConfig"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, ArrowRight } from "lucide-react"

export function StoreInfoStep({ onNext }: { onNext: () => void }) {
  const { config, setConfig, updateCategories } = useStoreConfig()
  const [newCat, setNewCat] = useState("")

  const handleNext = () => {
    if (!config.name.trim()) return
    onNext()
  }

  const addCategory = () => {
    if (newCat.trim() && !config.categories.includes(newCat.trim())) {
      updateCategories([...config.categories, newCat.trim()])
      setNewCat("")
    }
  }

  const removeCategory = (cat: string) => {
    updateCategories(config.categories.filter((c) => c !== cat))
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <div className="space-y-2.5">
          <Label htmlFor="storeName" className="text-base font-medium">
            Store Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="storeName"
            placeholder="e.g. Acme Electronics"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            className="h-12 text-lg"
            autoFocus
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2.5">
            <Label htmlFor="ownerName" className="text-base font-medium">
              Owner Name <span className="text-muted-foreground font-normal text-sm">(optional)</span>
            </Label>
            <Input
              id="ownerName"
              placeholder="e.g. John Doe"
              value={config.owner}
              onChange={(e) => setConfig({ ...config, owner: e.target.value })}
              className="h-11"
            />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="currency" className="text-base font-medium">Currency</Label>
            <select
              id="currency"
              className="flex h-11 w-full rounded-lg border border-border/60 bg-surface px-3.5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary/50 hover:border-border"
              value={config.currency}
              onChange={(e) => setConfig({ ...config, currency: e.target.value })}
            >
              <option value="₹">₹ (INR)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY)</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 pt-5 border-t border-border/30">
          <Label className="text-base font-medium">Product Categories</Label>
          <div className="flex flex-wrap gap-2">
            {config.categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-surface border-border/40">
                {cat}
                <button
                  type="button"
                  onClick={() => removeCategory(cat)}
                  className="rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 transition-colors duration-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm pt-1">
            <Input
              placeholder="Add new category"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory() } }}
            />
            <Button type="button" variant="outline" onClick={addCategory} disabled={!newCat.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button onClick={handleNext} disabled={!config.name.trim()} size="lg" className="font-bold px-8">
          Continue to Catalog
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
