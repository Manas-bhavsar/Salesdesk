"use server"

import { prisma } from "@/lib/db"
import type { Sale } from "@/types"

// ─── Helpers ───

type DbSaleRow = {
  id: string
  itemId: string
  itemName: string
  category: string
  variant: string | null
  totalCost: number
  totalSoldPrice: number
  profit: number
  date: string
  note: string
  customerName: string
  paymentStatus: string
  amountDue: number
  extraExpensesTotal: number
  createdAt: Date
  lineItems: {
    id: string
    itemId: string
    itemName: string
    category: string
    variant: string | null
    costPrice: number
    sellPrice: number
    qty: number
    totalCost: number
  }[]
  expenses: {
    id: string
    label: string
    amount: number
  }[]
}

function dbSaleToSale(row: DbSaleRow): Sale {
  return {
    id: row.id,
    itemId: row.itemId,
    itemName: row.itemName,
    category: row.category,
    variant: row.variant,
    totalCost: row.totalCost,
    totalSoldPrice: row.totalSoldPrice,
    profit: row.profit,
    date: row.date,
    note: row.note,
    customerName: row.customerName,
    paymentStatus: row.paymentStatus as Sale["paymentStatus"],
    amountDue: row.amountDue,
    extraExpensesTotal: row.extraExpensesTotal,
    createdAt: row.createdAt.getTime(),
    lineItems: row.lineItems.map((li) => ({
      id: li.id,
      itemId: li.itemId,
      itemName: li.itemName,
      category: li.category,
      variant: li.variant,
      costPrice: li.costPrice,
      sellPrice: li.sellPrice,
      qty: li.qty,
      totalCost: li.totalCost,
    })),
    expenses: row.expenses.map((e) => ({
      id: e.id,
      label: e.label,
      amount: e.amount,
    })),
  }
}

// ─── Actions ───

export async function getSalesAction(): Promise<Sale[]> {
  const rows = await prisma.sale.findMany({
    include: { lineItems: true, expenses: true },
    orderBy: { createdAt: "asc" },
  })

  return rows.map(dbSaleToSale)
}

export async function addSaleAction(sale: Sale): Promise<Sale> {
  const row = await prisma.sale.create({
    data: {
      id: sale.id,
      itemId: sale.itemId,
      itemName: sale.itemName,
      category: sale.category,
      variant: sale.variant,
      totalCost: sale.totalCost,
      totalSoldPrice: sale.totalSoldPrice,
      profit: sale.profit,
      date: sale.date,
      note: sale.note,
      customerName: sale.customerName,
      paymentStatus: sale.paymentStatus,
      amountDue: sale.amountDue,
      extraExpensesTotal: sale.extraExpensesTotal,
      createdAt: new Date(sale.createdAt),
      lineItems: {
        create: sale.lineItems.map((li) => ({
          id: li.id,
          itemId: li.itemId,
          itemName: li.itemName,
          category: li.category,
          variant: li.variant,
          costPrice: li.costPrice,
          sellPrice: li.sellPrice,
          qty: li.qty,
          totalCost: li.totalCost,
        })),
      },
      expenses: {
        create: sale.expenses.map((e) => ({
          id: e.id,
          label: e.label,
          amount: e.amount,
        })),
      },
    },
    include: { lineItems: true, expenses: true },
  })

  return dbSaleToSale(row)
}

export async function updateSaleAction(id: string, sale: Sale): Promise<Sale> {
  // Delete old nested records and replace
  await prisma.saleLineItem.deleteMany({ where: { saleId: id } })
  await prisma.saleExpense.deleteMany({ where: { saleId: id } })

  const row = await prisma.sale.update({
    where: { id },
    data: {
      itemId: sale.itemId,
      itemName: sale.itemName,
      category: sale.category,
      variant: sale.variant,
      totalCost: sale.totalCost,
      totalSoldPrice: sale.totalSoldPrice,
      profit: sale.profit,
      date: sale.date,
      note: sale.note,
      customerName: sale.customerName,
      paymentStatus: sale.paymentStatus,
      amountDue: sale.amountDue,
      extraExpensesTotal: sale.extraExpensesTotal,
      lineItems: {
        create: sale.lineItems.map((li) => ({
          id: li.id,
          itemId: li.itemId,
          itemName: li.itemName,
          category: li.category,
          variant: li.variant,
          costPrice: li.costPrice,
          sellPrice: li.sellPrice,
          qty: li.qty,
          totalCost: li.totalCost,
        })),
      },
      expenses: {
        create: sale.expenses.map((e) => ({
          id: e.id,
          label: e.label,
          amount: e.amount,
        })),
      },
    },
    include: { lineItems: true, expenses: true },
  })

  return dbSaleToSale(row)
}

export async function deleteSaleAction(id: string): Promise<void> {
  await prisma.sale.delete({ where: { id } })
}

export async function setSalesAction(sales: Sale[]): Promise<Sale[]> {
  // Bulk replace: delete all then create all (inside a transaction)
  await prisma.$transaction(async (tx) => {
    await tx.saleLineItem.deleteMany()
    await tx.saleExpense.deleteMany()
    await tx.sale.deleteMany()

    for (const sale of sales) {
      await tx.sale.create({
        data: {
          id: sale.id,
          itemId: sale.itemId,
          itemName: sale.itemName,
          category: sale.category,
          variant: sale.variant,
          totalCost: sale.totalCost,
          totalSoldPrice: sale.totalSoldPrice,
          profit: sale.profit,
          date: sale.date,
          note: sale.note,
          customerName: sale.customerName,
          paymentStatus: sale.paymentStatus,
          amountDue: sale.amountDue,
          extraExpensesTotal: sale.extraExpensesTotal,
          createdAt: new Date(sale.createdAt),
          lineItems: {
            create: sale.lineItems.map((li) => ({
              id: li.id,
              itemId: li.itemId,
              itemName: li.itemName,
              category: li.category,
              variant: li.variant,
              costPrice: li.costPrice,
              sellPrice: li.sellPrice,
              qty: li.qty,
              totalCost: li.totalCost,
            })),
          },
          expenses: {
            create: sale.expenses.map((e) => ({
              id: e.id,
              label: e.label,
              amount: e.amount,
            })),
          },
        },
      })
    }
  }, { maxWait: 10000, timeout: 30000 })

  return getSalesAction()
}
