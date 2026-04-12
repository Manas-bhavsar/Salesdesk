"use client"

import { useState, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Item, Sale } from "@/types"
import { useItemsStore } from "@/store/useItemsStore"
import { useStoreConfig } from "@/store/useStoreConfig"
import {
  parseWorkbook,
  detectItemColumns,
  detectSaleColumns,
  getItemFields,
  getSaleFields,
  mapRowsToItems,
  mapRowsToSales,
  RawRow,
  ColumnMapping,
  ParsedWorkbook,
} from "@/lib/importExcel"
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  Table2,
  Columns3,
  ChevronDown,
  Loader2,
} from "lucide-react"

type ImportMode = "items" | "sales"
type Step = "upload" | "sheet" | "mapping" | "confirm"

type ImportExcelModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ImportMode
  onImportItems?: (items: Item[]) => void
  onImportSales?: (sales: Sale[]) => void
}

export function ImportExcelModal({ open, onOpenChange, mode, onImportItems, onImportSales }: ImportExcelModalProps) {
  const items = useItemsStore((state) => state.items)
  const categories = useStoreConfig((state) => state.config.categories)

  const [step, setStep] = useState<Step>("upload")
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null)
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [rows, setRows] = useState<RawRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [fileName, setFileName] = useState("")
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Preview data for confirm step
  const [previewItems, setPreviewItems] = useState<Item[]>([])
  const [previewSales, setPreviewSales] = useState<Sale[]>([])
  const [skippedCount, setSkippedCount] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setStep("upload")
    setWorkbook(null)
    setSelectedSheet("")
    setColumnMapping({})
    setRows([])
    setHeaders([])
    setFileName("")
    setParsing(false)
    setError(null)
    setDragOver(false)
    setPreviewItems([])
    setPreviewSales([])
    setSkippedCount(0)
  }, [])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset()
      onOpenChange(open)
    },
    [onOpenChange, reset]
  )

  // ─── File handling ───

  const processFile = useCallback(
    async (file: File) => {
      setParsing(true)
      setError(null)
      setFileName(file.name)

      try {
        const wb = await parseWorkbook(file)
        setWorkbook(wb)

        if (wb.sheetNames.length === 0) {
          setError("This file has no sheets.")
          setParsing(false)
          return
        }

        if (wb.sheetNames.length === 1) {
          // Skip sheet selection — auto-select
          const sheetName = wb.sheetNames[0]
          setSelectedSheet(sheetName)
          const sheetRows = wb.sheets[sheetName] ?? []
          setupMapping(sheetRows)
        } else {
          // Multiple sheets — show picker
          setStep("sheet")
        }
      } catch {
        setError("Could not read this file. Make sure it's a valid Excel file (.xlsx or .xls).")
      } finally {
        setParsing(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode]
  )

  const setupMapping = useCallback(
    (sheetRows: RawRow[]) => {
      if (sheetRows.length === 0) {
        setError("This sheet is empty.")
        return
      }

      const hdrs = Object.keys(sheetRows[0])
      setHeaders(hdrs)
      setRows(sheetRows)

      const mapping = mode === "items" ? detectItemColumns(hdrs) : detectSaleColumns(hdrs)
      setColumnMapping(mapping)
      setStep("mapping")
    },
    [mode]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  // ─── Sheet selection ───

  const handleSheetSelect = useCallback(
    (sheetName: string) => {
      setSelectedSheet(sheetName)
      const sheetRows = workbook?.sheets[sheetName] ?? []
      setupMapping(sheetRows)
    },
    [workbook, setupMapping]
  )

  // ─── Column mapping update ───

  const updateMapping = useCallback((targetField: string, headerValue: string | null) => {
    setColumnMapping((prev) => ({ ...prev, [targetField]: headerValue }))
  }, [])

  // ─── Preview / confirm ───

  const handlePrepareImport = useCallback(() => {
    if (mode === "items") {
      const defaultCat = categories[0] || "Uncategorized"
      const result = mapRowsToItems(rows, columnMapping, defaultCat)
      setPreviewItems(result.items)
      setSkippedCount(result.skippedCount)
    } else {
      const result = mapRowsToSales(rows, columnMapping, items)
      setPreviewSales(result.sales)
      setSkippedCount(result.skippedCount)
    }
    setStep("confirm")
  }, [mode, rows, columnMapping, categories, items])

  // ─── Final import ───

  const handleImport = useCallback(() => {
    if (mode === "items" && onImportItems) {
      onImportItems(previewItems)
    } else if (mode === "sales" && onImportSales) {
      onImportSales(previewSales)
    }
    handleOpenChange(false)
  }, [mode, previewItems, previewSales, onImportItems, onImportSales, handleOpenChange])

  // ─── Helpers ───

  const fields = mode === "items" ? getItemFields() : getSaleFields()
  const previewRows = rows.slice(0, 5)
  const mappedHeaderCount = Object.values(columnMapping).filter(Boolean).length
  const totalFieldCount = fields.length
  const importCount = mode === "items" ? previewItems.length : previewSales.length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import {mode === "items" ? "Products" : "Sales"} from Excel
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload an Excel file to get started. The system will auto-detect the relevant columns."}
            {step === "sheet" && "This workbook has multiple sheets. Pick the one that contains your data."}
            {step === "mapping" && "Review the column mapping below. Adjust any mismatches before importing."}
            {step === "confirm" && "Everything looks good? Hit import to add the data to your store."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 py-2">
          {(["upload", "sheet", "mapping", "confirm"] as Step[])
            .filter((s) => s !== "sheet" || (workbook && workbook.sheetNames.length > 1))
            .map((s, i, arr) => {
              const stepIndex = arr.indexOf(step)
              const thisIndex = i
              const isActive = s === step
              const isDone = thisIndex < stepIndex

              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <div className={`w-6 h-px ${isDone || isActive ? "bg-primary/50" : "bg-border/50"}`} />}
                  <div
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200
                      ${isActive ? "bg-primary/15 text-primary border border-primary/25" : ""}
                      ${isDone ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : ""}
                      ${!isActive && !isDone ? "bg-muted/30 text-muted-foreground/60 border border-transparent" : ""}
                    `}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : null}
                    {s === "upload" && "Upload"}
                    {s === "sheet" && "Sheet"}
                    {s === "mapping" && "Map"}
                    {s === "confirm" && "Import"}
                  </div>
                </div>
              )
            })}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Step: Upload ─── */}
        {step === "upload" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div
              className={`
                relative flex flex-col items-center justify-center gap-4 py-12 px-6 
                border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer
                ${dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/50 bg-surface/30 hover:border-primary/40 hover:bg-surface/50"}
              `}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {parsing ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Reading {fileName}…</p>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-heading font-semibold">
                      Drop your Excel file here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse · <span className="text-primary font-medium">.xlsx, .xls</span>
                    </p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-surface/50 border border-border/30 text-xs text-muted-foreground">
              <Table2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-foreground text-sm">What we look for</p>
                <p>
                  {mode === "items"
                    ? "Item Name, Category, Cost Price, Inventory Qty, and variant info. Extra columns are ignored."
                    : "Date, Item Name, Qty, Sell Price, Cost Price, Total, Profit, Customer, and payment info. Extra columns are ignored."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step: Sheet selection ─── */}
        {step === "sheet" && workbook && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15 text-sm">
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">
                  {workbook.sheetNames.length} sheets found in <span className="font-mono text-primary">{fileName}</span>
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Select the sheet that contains your {mode === "items" ? "product catalog" : "sales history"} data.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {workbook.sheetNames.map((name) => {
                const rowCount = workbook.sheets[name]?.length ?? 0
                return (
                  <button
                    key={name}
                    onClick={() => handleSheetSelect(name)}
                    className={`
                      w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left
                      ${selectedSheet === name
                        ? "border-primary/40 bg-primary/8 shadow-sm shadow-primary/10"
                        : "border-border/40 bg-card/60 hover:border-border hover:bg-surface-hover/50"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${selectedSheet === name ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"}`}>
                        <Table2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{name}</p>
                        <p className="text-xs text-muted-foreground">{rowCount} row{rowCount !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <ArrowRight className={`h-4 w-4 ${selectedSheet === name ? "text-primary" : "text-muted-foreground/40"}`} />
                  </button>
                )
              })}
            </div>

            <div className="flex justify-start pt-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step: Mapping ─── */}
        {step === "mapping" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Columns3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Column mapping</span>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/15 font-mono text-[11px]">
                {mappedHeaderCount}/{totalFieldCount} matched
              </Badge>
            </div>

            {/* Mapping table */}
            <div className="border border-border/40 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider bg-surface/60 border-b border-border/40">
                    <th className="px-4 py-2.5 font-medium text-left">Field</th>
                    <th className="px-4 py-2.5 font-medium text-left">Mapped to column</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map(({ field, label }) => {
                    const mappedHeader = columnMapping[field]
                    return (
                      <tr key={field} className="border-b border-border/20 last:border-b-0">
                        <td className="px-4 py-2.5">
                          <span className="text-sm font-medium">{label}</span>
                          {field === "name" || (mode === "sales" && field === "itemName") ? (
                            <span className="text-destructive ml-1 text-xs">*</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="relative">
                            <select
                              value={mappedHeader ?? "__none__"}
                              onChange={(e) => {
                                const val = e.target.value
                                updateMapping(field, val === "__none__" ? null : val)
                              }}
                              className={`
                                w-full appearance-none rounded-lg border px-3 py-1.5 pr-8 text-xs outline-none transition-colors
                                ${mappedHeader
                                  ? "border-primary/40 bg-primary/10 text-foreground font-medium"
                                  : "border-border/60 bg-card text-muted-foreground"
                                }
                                focus:border-primary/50 focus:ring-2 focus:ring-ring/30
                                [&>option]:bg-card [&>option]:text-foreground
                              `}
                            >
                              <option value="__none__" className="bg-card text-muted-foreground">— Not mapped —</option>
                              {headers.map((h) => (
                                <option key={h} value={h} className="bg-card text-foreground">
                                  {h}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none ${mappedHeader ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Data preview */}
            {previewRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Data preview (first {previewRows.length} rows)
                </p>
                <div className="border border-border/40 rounded-xl overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-surface/60 border-b border-border/40">
                        {headers.slice(0, 8).map((h) => {
                          const isMapped = Object.values(columnMapping).includes(h)
                          return (
                            <th
                              key={h}
                              className={`px-3 py-2 font-medium text-left ${isMapped ? "text-primary" : "text-muted-foreground/50"}`}
                            >
                              {h}
                              {isMapped && <span className="ml-1 text-[10px]">✓</span>}
                            </th>
                          )
                        })}
                        {headers.length > 8 && (
                          <th className="px-3 py-2 font-medium text-muted-foreground/40">+{headers.length - 8} more</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="border-b border-border/10 last:border-b-0">
                          {headers.slice(0, 8).map((h) => {
                            const isMapped = Object.values(columnMapping).includes(h)
                            return (
                              <td
                                key={h}
                                className={`px-3 py-1.5 max-w-[150px] truncate ${isMapped ? "" : "text-muted-foreground/40"}`}
                              >
                                {String(row[h] ?? "")}
                              </td>
                            )
                          })}
                          {headers.length > 8 && <td className="px-3 py-1.5 text-muted-foreground/30">…</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (workbook && workbook.sheetNames.length > 1) setStep("sheet")
                  else setStep("upload")
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handlePrepareImport}
                disabled={
                  mode === "items"
                    ? !columnMapping["name"]
                    : !columnMapping["itemName"]
                }
              >
                Preview import
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step: Confirm ─── */}
        {step === "confirm" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Ready to import</p>
                <p className="mt-2 text-2xl font-heading font-bold text-primary">{importCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {mode === "items" ? "item" : "sale"}{importCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Skipped rows</p>
                <p className="mt-2 text-2xl font-heading font-bold">{skippedCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {skippedCount > 0
                    ? mode === "items"
                      ? "missing item name"
                      : "missing item name"
                    : "none skipped"}
                </p>
              </div>
            </div>

            {/* Quick list preview */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                First {Math.min(mode === "items" ? previewItems.length : previewSales.length, 8)} records
              </p>
              <div className="border border-border/40 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
                {mode === "items" ? (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr className="bg-surface/80 border-b border-border/40 text-muted-foreground uppercase tracking-wider">
                        <th className="px-3 py-2 font-medium text-left">Name</th>
                        <th className="px-3 py-2 font-medium text-left">Category</th>
                        <th className="px-3 py-2 font-medium text-right">Cost</th>
                        <th className="px-3 py-2 font-medium text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewItems.slice(0, 8).map((item) => (
                        <tr key={item.id} className="border-b border-border/10 last:border-b-0">
                          <td className="px-3 py-1.5 font-medium">{item.name}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{item.category}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{item.hasVariants ? "—" : item.costPrice}</td>
                          <td className="px-3 py-1.5 text-right font-mono">
                            {item.hasVariants ? `${item.variants.length} var` : item.stockQuantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr className="bg-surface/80 border-b border-border/40 text-muted-foreground uppercase tracking-wider">
                        <th className="px-3 py-2 font-medium text-left">Date</th>
                        <th className="px-3 py-2 font-medium text-left">Item</th>
                        <th className="px-3 py-2 font-medium text-right">Qty</th>
                        <th className="px-3 py-2 font-medium text-right">Sold Amount</th>
                        <th className="px-3 py-2 font-medium text-left">Customer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewSales.slice(0, 8).map((sale) => (
                        <tr key={sale.id} className="border-b border-border/10 last:border-b-0">
                          <td className="px-3 py-1.5 text-muted-foreground">{sale.date}</td>
                          <td className="px-3 py-1.5 font-medium">{sale.itemName}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{sale.lineItems[0]?.qty || 0}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{sale.totalSoldPrice}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{sale.customerName || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {skippedCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {skippedCount} row{skippedCount !== 1 ? "s were" : " was"} skipped because{" "}
                {mode === "items" ? "the item name was empty." : "the item name was empty."}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={importCount === 0}
                className="shadow-lg shadow-primary/20 hover:shadow-primary/40"
              >
                <Check className="h-4 w-4" />
                Import {importCount} {mode === "items" ? "item" : "sale"}{importCount !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
