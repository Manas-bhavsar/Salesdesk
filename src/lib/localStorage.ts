import { StoreConfig, Item, Sale } from "@/types";

export function getStoreConfig(): StoreConfig | null {
  try {
    const data = localStorage.getItem("sd_store");
    if (data) return JSON.parse(data) as StoreConfig;
  } catch (e) {
    console.error("Failed to parse sd_store", e);
  }
  return null;
}

export function setStoreConfig(config: StoreConfig): void {
  try {
    localStorage.setItem("sd_store", JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save sd_store", e);
  }
}

export function getItems(): Item[] {
  try {
    const data = localStorage.getItem("sd_items");
    if (data) return JSON.parse(data) as Item[];
  } catch (e) {
    console.error("Failed to parse sd_items", e);
  }
  return [];
}

export function setItems(items: Item[]): void {
  try {
    localStorage.setItem("sd_items", JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save sd_items", e);
  }
}

export function getSales(): Sale[] {
  try {
    const data = localStorage.getItem("sd_sales");
    if (data) return JSON.parse(data) as Sale[];
  } catch (e) {
    console.error("Failed to parse sd_sales", e);
  }
  return [];
}

export function setSales(sales: Sale[]): void {
  try {
    localStorage.setItem("sd_sales", JSON.stringify(sales));
  } catch (e) {
    console.error("Failed to save sd_sales", e);
  }
}

export function clearAllData(): void {
  localStorage.removeItem("sd_store");
  localStorage.removeItem("sd_items");
  localStorage.removeItem("sd_sales");
}
