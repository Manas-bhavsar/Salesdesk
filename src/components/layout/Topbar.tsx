import { useStoreConfig } from "@/store/useStoreConfig"
import { useItemsStore } from "@/store/useItemsStore"
import { useSalesStore } from "@/store/useSalesStore"
import { clearAllData } from "@/lib/localStorage"
import type { TabType } from "./AppShell"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RotateCcw, LayoutDashboard, Tags, Sparkles } from "lucide-react"

export function Topbar({ activeTab, onTabChange }: { activeTab: TabType, onTabChange: (t: TabType) => void }) {
  const { config, resetStore } = useStoreConfig()
  const setItems = useItemsStore(state => state.setItems)
  const setSales = useSalesStore(state => state.setSales)

  const handleReset = () => {
    clearAllData()
    resetStore()
    setItems([])
    setSales([])
    window.location.reload()
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-[56px] border-b border-border/40 bg-background/80 backdrop-blur-xl z-40 flex items-center px-5 justify-between">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="text-lg font-heading font-bold select-none tracking-tight">
            Sales<span className="gradient-text">Desk</span>
          </div>
        </div>
        <div className="hidden md:flex items-center bg-surface border border-border/40 px-2.5 py-1 rounded-lg text-xs text-muted-foreground max-w-[160px] truncate select-none">
          {config.name}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center h-full">
        <div className="flex gap-1 bg-surface/80 border border-border/40 rounded-xl p-1">
          <button
            onClick={() => onTabChange("dashboard")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "dashboard" 
                ? "bg-primary/15 text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={() => onTabChange("catalog")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "catalog" 
                ? "bg-primary/15 text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Catalog</span>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Store Data?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your store configuration, entire catalog, and all sales records.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleReset}>Yes, reset everything</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
