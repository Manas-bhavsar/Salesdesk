"use server"

import { prisma } from "@/lib/db"
import type { StoreConfig } from "@/types"

const DEFAULT_CONFIG: StoreConfig = {
  name: "",
  owner: "",
  currency: "₹",
  categories: ["Electronics", "Clothing", "Food", "Books", "Accessories", "Other"],
  setupComplete: false,
}

export async function getStoreConfigAction(): Promise<StoreConfig> {
  const row = await prisma.storeConfig.findUnique({ where: { id: "default" } })

  if (!row) return DEFAULT_CONFIG

  return {
    name: row.name,
    owner: row.owner,
    currency: row.currency,
    categories: row.categories,
    setupComplete: row.setupComplete,
  }
}

export async function updateStoreConfigAction(config: StoreConfig): Promise<StoreConfig> {
  const row = await prisma.storeConfig.upsert({
    where: { id: "default" },
    update: {
      name: config.name,
      owner: config.owner,
      currency: config.currency,
      categories: config.categories,
      setupComplete: config.setupComplete,
    },
    create: {
      id: "default",
      name: config.name,
      owner: config.owner,
      currency: config.currency,
      categories: config.categories,
      setupComplete: config.setupComplete,
    },
  })

  return {
    name: row.name,
    owner: row.owner,
    currency: row.currency,
    categories: row.categories,
    setupComplete: row.setupComplete,
  }
}

export async function resetStoreConfigAction(): Promise<StoreConfig> {
  await prisma.storeConfig.deleteMany()
  return DEFAULT_CONFIG
}
