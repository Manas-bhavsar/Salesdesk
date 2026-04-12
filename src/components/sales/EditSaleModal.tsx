import { useSalesStore } from "@/store/useSalesStore"
import { Dialog } from "@/components/ui/dialog"
import { Sale } from "@/types"
import { SaleForm } from "@/components/sales/SaleForm"

interface EditSaleModalProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditSaleModal({ sale, open, onOpenChange, onSuccess }: EditSaleModalProps) {
  const updateSale = useSalesStore(state => state.updateSale)

  if (!sale) return null

  const handleSubmit = (updatedSale: Sale) => {
    updateSale(sale.id, updatedSale)
    onOpenChange(false)
    if (onSuccess) onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <SaleForm
          sale={sale}
          title="Edit Sale"
          submitLabel="Save changes"
          submitIcon="check"
          accentClassName="bg-primary/15 text-primary"
          onOpenChange={onOpenChange}
          onSubmitSale={handleSubmit}
        />
      ) : null}
    </Dialog>
  )
}
