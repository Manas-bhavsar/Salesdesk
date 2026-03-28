import { AppBackup, Item, Sale, StoreConfig } from "@/types"
import { getItems, getSales, getStoreConfig, setItems, setSales, setStoreConfig } from "@/lib/localStorage"

const fallbackStoreConfig: StoreConfig = {
  name: "",
  owner: "",
  currency: "₹",
  categories: ["Electronics", "Clothing", "Food", "Books", "Accessories", "Other"],
  setupComplete: false,
}

function isStoreConfig(value: unknown): value is StoreConfig {
  if (!value || typeof value !== "object") return false

  const config = value as Partial<StoreConfig>

  return (
    typeof config.name === "string" &&
    typeof config.owner === "string" &&
    typeof config.currency === "string" &&
    Array.isArray(config.categories) &&
    config.categories.every(category => typeof category === "string") &&
    typeof config.setupComplete === "boolean"
  )
}

function isItemList(value: unknown): value is Item[] {
  return Array.isArray(value)
}

function isSaleList(value: unknown): value is Sale[] {
  return Array.isArray(value)
}

export function createBackupData(): AppBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    storeConfig: getStoreConfig() ?? fallbackStoreConfig,
    items: getItems(),
    sales: getSales(),
  }
}

export function downloadBackup(): void {
  const backup = createBackupData()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = `salesdesk-backup-${backup.exportedAt.slice(0, 10)}.json`
  link.click()

  URL.revokeObjectURL(url)
}

export function parseBackupFileContent(content: string): AppBackup {
  let parsed: unknown

  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error("Backup file is not valid JSON")
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Backup file has an invalid format")
  }

  const backup = parsed as Partial<AppBackup>

  if (backup.version !== 1) {
    throw new Error("Unsupported backup version")
  }

  if (typeof backup.exportedAt !== "string") {
    throw new Error("Backup file is missing export metadata")
  }

  if (!isStoreConfig(backup.storeConfig)) {
    throw new Error("Backup file has an invalid store configuration")
  }

  if (!isItemList(backup.items)) {
    throw new Error("Backup file has an invalid items payload")
  }

  if (!isSaleList(backup.sales)) {
    throw new Error("Backup file has an invalid sales payload")
  }

  return {
    version: 1,
    exportedAt: backup.exportedAt,
    storeConfig: backup.storeConfig,
    items: backup.items,
    sales: backup.sales,
  }
}

export function restoreBackupData(backup: AppBackup): void {
  setStoreConfig(backup.storeConfig)
  setItems(backup.items)
  setSales(backup.sales)
}
