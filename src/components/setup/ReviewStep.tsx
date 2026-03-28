import { useStoreConfig } from "@/store/useStoreConfig"
import { useItemsStore } from "@/store/useItemsStore"
import { Button } from "@/components/ui/button"
import { getCategoryColor } from "@/lib/utils"
import { Rocket, Store, Tag, ArrowLeft, Sparkles } from "lucide-react"

export function ReviewStep({ onBack }: { onBack: () => void }) {
  const { config, setConfig } = useStoreConfig()
  const items = useItemsStore(state => state.items)

  const handleLaunch = () => {
    setConfig({ ...config, setupComplete: true })
  }

  const categoryCounts = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-3 pb-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
          <Rocket className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-heading font-bold">You&apos;re all set!</h2>
        <p className="text-muted-foreground">Review your store details before launching.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Store info card */}
        <div className="space-y-4 p-5 rounded-2xl border border-border/40 bg-surface/50">
          <div className="flex items-center gap-2 font-heading font-semibold text-base border-b border-border/30 pb-3">
            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Store className="h-4 w-4 text-primary" />
            </div>
            Store Info
          </div>
          <div className="space-y-4 pt-1">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Store Name</div>
              <div className="font-medium text-lg">{config.name}</div>
            </div>
            {config.owner && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Owner</div>
                <div className="font-medium">{config.owner}</div>
              </div>
            )}
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Currency</div>
              <div className="font-medium text-xl w-9 h-9 flex items-center justify-center bg-card rounded-lg border border-border/40 mt-1">{config.currency}</div>
            </div>
          </div>
        </div>

        {/* Catalog card */}
        <div className="space-y-4 p-5 rounded-2xl border border-border/40 bg-surface/50">
          <div className="flex items-center justify-between border-b border-border/30 pb-3">
            <div className="flex items-center gap-2 font-heading font-semibold text-base">
              <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              Catalog
            </div>
            <div className="bg-primary text-primary-foreground font-bold px-2.5 py-0.5 rounded-full text-xs">
              {items.length} items
            </div>
          </div>
          <div className="space-y-2 pt-1 max-h-[150px] overflow-y-auto custom-scrollbar">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Category Breakdown</div>
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between text-sm py-1.5">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full shadow-sm"
                    style={{ backgroundColor: getCategoryColor(cat, config.categories) }}
                  />
                  <span>{cat}</span>
                </div>
                <span className="font-mono bg-card px-2 py-0.5 rounded-md border border-border/30 text-xs text-muted-foreground">{count}</span>
              </div>
            ))}
            {Object.keys(categoryCounts).length === 0 && (
              <div className="text-sm text-muted-foreground/50 italic">No categories used yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-5 border-t border-border/30">
        <Button variant="outline" onClick={onBack} className="px-5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleLaunch}
          size="lg"
          className="font-bold px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300"
        >
          <Sparkles className="h-4 w-4" />
          Launch my store
        </Button>
      </div>
    </div>
  )
}
