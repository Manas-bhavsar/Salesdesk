import { useEffect, useRef, useState } from "react"
import { useStoreConfig } from "@/store/useStoreConfig"
import { useItemsStore } from "@/store/useItemsStore"
import { useSalesStore } from "@/store/useSalesStore"
import { clearAllData } from "@/lib/localStorage"
import { downloadBackup, parseBackupFileContent, restoreBackupData } from "@/lib/backup"
import { AppTheme, applyTheme, getStoredTheme, setStoredTheme } from "@/lib/theme"
import { useToast } from "@/components/ui/Toast"
import type { TabType } from "./AppShell"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RotateCcw, LayoutDashboard, Tags, Sparkles, Download, Upload, ListOrdered, Moon, Sun, Archive } from "lucide-react"

export function Topbar({ activeTab, onTabChange }: { activeTab: TabType, onTabChange: (t: TabType) => void }) {
  const { config, resetStore } = useStoreConfig()
  const setConfig = useStoreConfig(state => state.setConfig)
  const setItems = useItemsStore(state => state.setItems)
  const setSales = useSalesStore(state => state.setSales)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [theme, setTheme] = useState<AppTheme>("dark")
  const { toast } = useToast()

  useEffect(() => {
    const storedTheme = getStoredTheme() ?? "dark"
    setTheme(storedTheme)
    applyTheme(storedTheme)
  }, [])

  const handleReset = () => {
    clearAllData()
    resetStore()
    setItems([])
    setSales([])
    window.location.reload()
  }

  const handleBackup = () => {
    downloadBackup()
    toast("Backup downloaded successfully")
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      const content = await file.text()
      const backup = parseBackupFileContent(content)

      restoreBackupData(backup)
      setConfig(backup.storeConfig)
      setItems(backup.items)
      setSales(backup.sales)
      toast("Backup imported successfully")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to import backup"
      toast(message, "error")
    } finally {
      event.target.value = ""
    }
  }

  const handleThemeToggle = () => {
    const nextTheme: AppTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    setStoredTheme(nextTheme)
    applyTheme(nextTheme)
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-[56px] border-b border-border/40 bg-background/80 backdrop-blur-xl z-40 flex items-center px-5 justify-between">
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
            <span className="hidden sm:inline">Home</span>
          </button>
          <button
            onClick={() => onTabChange("sales")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "sales"
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <ListOrdered className="h-4 w-4" />
            <span className="hidden sm:inline">Sales</span>
          </button>
          <button
            onClick={() => onTabChange("inventory")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "inventory"
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">Inventory</span>
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

      <div className="flex items-center gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportFile}
        />
        <Button variant="ghost" size="sm" onClick={handleBackup} className="text-muted-foreground">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Backup</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleImportClick} className="text-muted-foreground">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Import</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleThemeToggle} className="text-muted-foreground">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
        </Button>
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
