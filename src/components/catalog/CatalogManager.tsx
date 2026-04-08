import { useState } from "react"
import { useItemsStore } from "@/store/useItemsStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import { AddItemForm } from "./AddItemForm"
import { EditItemModal } from "./EditItemModal"
import { exportItemsCatalog } from "@/lib/exportExcel"
import { useToast } from "@/components/ui/Toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/calculations"
import { getCategoryColor } from "@/lib/utils"
import { Trash2, Download, Plus, Package, Pencil } from "lucide-react"
import { Item } from "@/types"

export function CatalogManager() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const { items, deleteItem } = useItemsStore()
  const currency = useStoreConfig(state => state.config.currency)
  const categories = useStoreConfig(state => state.config.categories)
  const { toast } = useToast()

  const handleExport = () => {
    if (items.length === 0) return
    exportItemsCatalog(items, currency)
    toast("Catalog exported to Excel successfully")
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item? This will not affect past sales records.")) {
      deleteItem(id)
      toast("Item deleted successfully")
    }
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setEditModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-heading font-bold tracking-tight">Catalog</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''} in your store
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={items.length === 0}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? "secondary" : "default"}
            className={showAddForm ? "" : "shadow-lg shadow-primary/20 hover:shadow-primary/40"}
          >
            <Plus className={`h-4 w-4 transition-transform duration-200 ${showAddForm ? 'rotate-45' : ''}`} />
            {showAddForm ? "Cancel" : "Add item"}
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
          <AddItemForm onSuccess={() => {
            setShowAddForm(false)
            toast("Item added to catalog")
          }} />
        </div>
      )}

      {/* Table */}
      <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/80 shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider bg-surface/60 border-b border-border/40">
                <th className="px-5 py-3.5 font-medium">Name</th>
                <th className="px-5 py-3.5 font-medium">Category</th>
                <th className="px-5 py-3.5 font-medium">SKU</th>
                <th className="px-5 py-3.5 font-medium text-right">Sale Price</th>
                <th className="px-5 py-3.5 font-medium text-right">Cost Price</th>
                <th className="px-5 py-3.5 font-medium text-center">Variants</th>
                <th className="px-5 py-3.5 font-medium text-center w-24"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                        <Package className="h-7 w-7 text-muted-foreground/50" />
                      </div>
                      <p className="font-heading font-semibold mb-1">No items in catalog</p>
                      <p className="text-sm text-muted-foreground">Click <span className="font-medium text-primary">Add item</span> to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : items.map((item, i) => (
                <tr
                  key={item.id}
                  className="group border-b border-border/20 hover:bg-surface-hover/50 transition-colors last:border-b-0 table-row-animate"
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  <td className="px-5 py-3.5 font-medium">{item.name}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full shadow-sm shrink-0"
                        style={{ backgroundColor: getCategoryColor(item.category, categories) }}
                      />
                      <span className="text-muted-foreground">{item.category}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{item.sku || "—"}</td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                    <span className="text-muted-foreground/60 text-xs font-sans">Set on sale</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                    {item.hasVariants ? <span className="text-muted-foreground/40">—</span> : formatCurrency(item.costPrice, currency)}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {item.hasVariants ? (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/15 font-normal text-[11px]">
                        {item.variants.length} variants
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                        className="h-7 w-7 text-muted-foreground/40 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <EditItemModal
        item={editingItem}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => toast("Item updated successfully")}
      />
    </div>
  )
}
