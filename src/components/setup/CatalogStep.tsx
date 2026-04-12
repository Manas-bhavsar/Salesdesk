import { useItemsStore } from "@/store/useItemsStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { AddItemForm } from "@/components/catalog/AddItemForm"
import { ImportExcelModal } from "@/components/import/ImportExcelModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/calculations"
import { getCategoryColor } from "@/lib/utils"
import { Trash2, PackageSearch, ArrowRight, ArrowLeft, Upload } from "lucide-react"
import { useState } from "react"

export function CatalogStep({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const { items, deleteItem, setItems } = useItemsStore()
  const { currency, categories } = useStoreConfig(state => state.config)
  const [importModalOpen, setImportModalOpen] = useState(false)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-heading font-bold">Build your catalog</h2>
        <p className="text-muted-foreground">Add at least one item to get started. You can always add more later.</p>
      </div>

      <AddItemForm />

      {/* Import from Excel */}
      <button
        type="button"
        onClick={() => setImportModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-border/40 rounded-xl text-sm text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-200"
      >
        <Upload className="h-4 w-4" />
        Import items from Excel
      </button>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-lg">Added Items</h3>
          <span className="text-xs text-muted-foreground bg-surface px-2.5 py-1 rounded-full border border-border/40 font-mono">
            {items.length}
          </span>
        </div>
        
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border/40 rounded-2xl bg-surface/50 text-center">
            <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
              <PackageSearch className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="font-heading font-semibold">No items added yet</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">Use the form above to add products to your store.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 border border-border/30 rounded-xl bg-surface/50 hover:bg-surface-hover/50 transition-all duration-200 table-row-animate"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: getCategoryColor(item.category, categories) }}
                  />
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    {item.hasVariants ? (
                      <div className="space-y-1">
                        <Badge variant="secondary" className="bg-primary/10 text-primary font-mono border-primary/15 text-[11px]">{item.variants.length} variants</Badge>
                        <div className="text-[11px] text-muted-foreground">
                          Qty {item.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0)}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="font-mono text-sm">{formatCurrency(item.costPrice, currency)}</div>
                        <div className="text-[11px] text-muted-foreground">Qty {item.stockQuantity}</div>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-5 border-t border-border/30">
        <Button variant="outline" onClick={onBack} className="px-5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={items.length === 0} size="lg" className="font-bold px-8">
          Review & Launch
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <ImportExcelModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        mode="items"
        onImportItems={(imported) => {
          setItems([...items, ...imported])
        }}
      />
    </div>
  )
}
