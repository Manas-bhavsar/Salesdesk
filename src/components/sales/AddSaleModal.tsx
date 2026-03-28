import { useSalesStore } from "@/store/useSalesStore"
import { useToast } from "@/components/ui/Toast"
import { Dialog } from "@/components/ui/dialog"
import { Sale } from "@/types"
import { SaleForm } from "@/components/sales/SaleForm"

export function AddSaleModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const addSale = useSalesStore(state => state.addSale)
  const { toast } = useToast()

  const handleSubmit = (sale: Sale) => {
    addSale(sale)
    toast("Sale recorded successfully")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <SaleForm
          title="Record Sale"
          submitLabel="Record sale"
          submitIcon="arrow"
          accentClassName="bg-primary/15 text-primary"
          onOpenChange={onOpenChange}
          onSubmitSale={handleSubmit}
        />
      ) : null}
    </Dialog>
  )
}
