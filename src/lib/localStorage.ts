import { StoreConfig, Item, Sale } from "@/types";

// ─── IndexedDB Storage ───
// Uses IndexedDB as the primary persistent store, with localStorage as a
// synchronous fallback for instant hydration on page load.
// Writes go to BOTH IndexedDB and localStorage (dual-write).
// Reads prefer IndexedDB, falling back to localStorage.

const DB_NAME = "salesdesk_db";
const DB_VERSION = 1;
const STORE_NAME = "app_data";

// Keys used in the object store
const KEYS = {
  storeConfig: "sd_store",
  items: "sd_items",
  sales: "sd_sales",
} as const;

// ─── Low-level IndexedDB helpers ───

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (e) {
    console.error(`IndexedDB get failed for key "${key}":`, e);
    return null;
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (e) {
    console.error(`IndexedDB set failed for key "${key}":`, e);
  }
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (e) {
    console.error(`IndexedDB delete failed for key "${key}":`, e);
  }
}

// ─── localStorage helpers (sync fallback for instant hydration) ───

function lsGet<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data) as T;
  } catch (e) {
    console.error(`localStorage parse failed for key "${key}":`, e);
  }
  return null;
}

function lsSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`localStorage set failed for key "${key}":`, e);
  }
}

function lsRemove(key: string): void {
  localStorage.removeItem(key);
}

export function normalizeItems(items: Item[] | null): Item[] {
  if (!items) return [];

  return items.map((item) => ({
    ...item,
    sellPrice: typeof item.sellPrice === "number" ? item.sellPrice : 0,
    costPrice: typeof item.costPrice === "number" ? item.costPrice : 0,
    stockQuantity: typeof item.stockQuantity === "number" ? item.stockQuantity : 0,
    variants: Array.isArray(item.variants)
      ? item.variants.map((variant) => ({
          ...variant,
          sellPrice: typeof variant.sellPrice === "number" ? variant.sellPrice : 0,
          costPrice: typeof variant.costPrice === "number" ? variant.costPrice : 0,
          stockQuantity: typeof variant.stockQuantity === "number" ? variant.stockQuantity : 0,
        }))
      : [],
  }));
}

// ─── Public API: Sync getters (for store initialization) ───
// These read from localStorage for instant, synchronous hydration.

export function getStoreConfig(): StoreConfig | null {
  return lsGet<StoreConfig>(KEYS.storeConfig);
}

export function getItems(): Item[] {
  return normalizeItems(lsGet<Item[]>(KEYS.items));
}

export function getSales(): Sale[] {
  return lsGet<Sale[]>(KEYS.sales) ?? [];
}

// ─── Public API: Setters (dual-write to both IndexedDB + localStorage) ───

export function setStoreConfig(config: StoreConfig): void {
  lsSet(KEYS.storeConfig, config);
  idbSet(KEYS.storeConfig, config);
}

export function setItems(items: Item[]): void {
  const normalizedItems = normalizeItems(items);
  lsSet(KEYS.items, normalizedItems);
  idbSet(KEYS.items, normalizedItems);
}

export function setSales(sales: Sale[]): void {
  lsSet(KEYS.sales, sales);
  idbSet(KEYS.sales, sales);
}

// ─── Public API: Clear all data ───

export function clearAllData(): void {
  lsRemove(KEYS.storeConfig);
  lsRemove(KEYS.items);
  lsRemove(KEYS.sales);
  idbDelete(KEYS.storeConfig);
  idbDelete(KEYS.items);
  idbDelete(KEYS.sales);
}

// ─── Hydration from IndexedDB ───
// Call this once on app startup. If IndexedDB has data that localStorage
// doesn't (e.g. user cleared browser cache but IndexedDB survived),
// it restores that data back into localStorage and returns it so
// Zustand stores can update their state.

export type HydrationResult = {
  config: StoreConfig | null;
  items: Item[] | null;
  sales: Sale[] | null;
  restoredFromIDB: boolean;
};

export async function hydrateFromIndexedDB(): Promise<HydrationResult> {
  const result: HydrationResult = {
    config: null,
    items: null,
    sales: null,
    restoredFromIDB: false,
  };

  try {
    const [idbConfig, idbItems, idbSales] = await Promise.all([
      idbGet<StoreConfig>(KEYS.storeConfig),
      idbGet<Item[]>(KEYS.items),
      idbGet<Sale[]>(KEYS.sales),
    ]);

    const lsConfig = lsGet<StoreConfig>(KEYS.storeConfig);
    const lsItems = lsGet<Item[]>(KEYS.items);
    const lsSales = lsGet<Sale[]>(KEYS.sales);

    // If IDB has data but localStorage doesn't, restore it
    if (idbConfig && !lsConfig) {
      lsSet(KEYS.storeConfig, idbConfig);
      result.config = idbConfig;
      result.restoredFromIDB = true;
    }

    if (idbItems && idbItems.length > 0 && (!lsItems || lsItems.length === 0)) {
      const normalizedItems = normalizeItems(idbItems);
      lsSet(KEYS.items, normalizedItems);
      result.items = normalizedItems;
      result.restoredFromIDB = true;
    }

    if (idbSales && idbSales.length > 0 && (!lsSales || lsSales.length === 0)) {
      lsSet(KEYS.sales, idbSales);
      result.sales = idbSales;
      result.restoredFromIDB = true;
    }

    // If localStorage has data but IDB doesn't, seed IDB (first-time migration)
    if (lsConfig && !idbConfig) {
      await idbSet(KEYS.storeConfig, lsConfig);
    }
    if (lsItems && lsItems.length > 0 && (!idbItems || idbItems.length === 0)) {
      await idbSet(KEYS.items, normalizeItems(lsItems));
    }
    if (lsSales && lsSales.length > 0 && (!idbSales || idbSales.length === 0)) {
      await idbSet(KEYS.sales, lsSales);
    }
  } catch (e) {
    console.error("IndexedDB hydration failed, using localStorage only:", e);
  }

  return result;
}
