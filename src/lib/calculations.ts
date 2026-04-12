import { Item, Sale, ItemBreakdown } from "@/types";
import { getSaleLineItems } from "@/lib/sales";

export function calcTotal(sellPrice: number, qty: number): number {
  return sellPrice * qty;
}

export function calcProfit(sellPrice: number, costPrice: number, qty: number): number {
  return (sellPrice - costPrice) * qty;
}

export function calcMargin(profit: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (profit / revenue) * 100;
}

export function getItemBreakdowns(_items: Item[], sales: Sale[]): ItemBreakdown[] {
  const breakdownMap = new Map<string, ItemBreakdown>();

  for (const sale of sales) {
    for (const lineItem of getSaleLineItems(sale)) {
      if (!breakdownMap.has(lineItem.itemId)) {
        breakdownMap.set(lineItem.itemId, {
          itemId: lineItem.itemId,
          itemName: lineItem.itemName,
          category: lineItem.category,
          unitsSold: 0,
          revenue: 0, // In bill-based, we don't know revenue per item, so we'll use totalCost as a proxy or just zero it out
          profit: 0,
          margin: 0,
        });
      }

      const bd = breakdownMap.get(lineItem.itemId)!;
      bd.unitsSold += lineItem.qty;
      bd.revenue += lineItem.totalCost; // This is actually cost now
    }
  }

  const result = Array.from(breakdownMap.values());
  return result.sort((a, b) => b.unitsSold - a.unitsSold);
}

export function formatCurrency(value: number, symbol: string): string {
  const isIndian = symbol === '₹';
  const formatter = new Intl.NumberFormat(isIndian ? 'en-IN' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const formatted = formatter.format(Math.abs(value));
  return value < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}
