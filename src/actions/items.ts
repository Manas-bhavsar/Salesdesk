"use server"

import { prisma } from "@/lib/db"
import type { Item } from "@/types"

// ─── Helpers ───

function dbItemToItem(row: {
  id: string
  name: string
  category: string
  sellPrice: number
  costPrice: number
  stockQuantity: number
  hasVariants: boolean
  createdAt: Date
  variants: {
    id: string
    name: string
    sellPrice: number
    costPrice: number
    stockQuantity: number
  }[]
}): Item {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    sellPrice: row.sellPrice,
    costPrice: row.costPrice,
    stockQuantity: row.stockQuantity,
    hasVariants: row.hasVariants,
    createdAt: row.createdAt.getTime(),
    variants: row.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sellPrice: v.sellPrice,
      costPrice: v.costPrice,
      stockQuantity: v.stockQuantity,
    })),
  }
}

// ─── Actions ───

export async function getItemsAction(): Promise<Item[]> {
  const rows = await prisma.item.findMany({
    include: { variants: true },
    orderBy: { createdAt: "asc" },
  })

  return rows.map(dbItemToItem)
}

export async function addItemAction(item: Item): Promise<Item> {
  const row = await prisma.item.create({
    data: {
      id: item.id,
      name: item.name,
      category: item.category,
      sellPrice: item.sellPrice,
      costPrice: item.costPrice,
      stockQuantity: item.stockQuantity,
      hasVariants: item.hasVariants,
      createdAt: new Date(item.createdAt),
      variants: {
        create: item.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sellPrice: v.sellPrice,
          costPrice: v.costPrice,
          stockQuantity: v.stockQuantity,
        })),
      },
    },
    include: { variants: true },
  })

  return dbItemToItem(row)
}

export async function updateItemAction(id: string, item: Item): Promise<Item> {
  // Update item and replace all variants (delete old, create new)
  await prisma.variant.deleteMany({ where: { itemId: id } })

  const row = await prisma.item.update({
    where: { id },
    data: {
      name: item.name,
      category: item.category,
      sellPrice: item.sellPrice,
      costPrice: item.costPrice,
      stockQuantity: item.stockQuantity,
      hasVariants: item.hasVariants,
      variants: {
        create: item.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sellPrice: v.sellPrice,
          costPrice: v.costPrice,
          stockQuantity: v.stockQuantity,
        })),
      },
    },
    include: { variants: true },
  })

  return dbItemToItem(row)
}

export async function deleteItemAction(id: string): Promise<void> {
  await prisma.item.delete({ where: { id } })
}

export async function setItemsAction(items: Item[]): Promise<Item[]> {
  // Bulk replace: delete all then create all (inside a transaction)
  await prisma.$transaction(async (tx) => {
    await tx.variant.deleteMany()
    await tx.item.deleteMany()

    for (const item of items) {
      await tx.item.create({
        data: {
          id: item.id,
          name: item.name,
          category: item.category,
          sellPrice: item.sellPrice,
          costPrice: item.costPrice,
          stockQuantity: item.stockQuantity,
          hasVariants: item.hasVariants,
          createdAt: new Date(item.createdAt),
          variants: {
            create: item.variants.map((v) => ({
              id: v.id,
              name: v.name,
              sellPrice: v.sellPrice,
              costPrice: v.costPrice,
              stockQuantity: v.stockQuantity,
            })),
          },
        },
      })
    }
  }, { maxWait: 10000, timeout: 30000 })

  return getItemsAction()
}
