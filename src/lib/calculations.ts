import { Item, Sale, ItemBreakdown } from "@/types";

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

export function getItemBreakdowns(items: Item[], sales: Sale[]): ItemBreakdown[] {
  const breakdownMap = new Map<string, ItemBreakdown>();

  for (const sale of sales) {
    if (!breakdownMap.has(sale.itemId)) {
      breakdownMap.set(sale.itemId, {
        itemId: sale.itemId,
        itemName: sale.itemName,
        category: sale.category,
        unitsSold: 0,
        revenue: 0,
        profit: 0,
        margin: 0,
      });
    }

    const bd = breakdownMap.get(sale.itemId)!;
    bd.unitsSold += sale.qty;
    bd.revenue += sale.total;
    bd.profit += sale.profit;
  }

  const result = Array.from(breakdownMap.values()).map(bd => {
    bd.margin = calcMargin(bd.profit, bd.revenue);
    return bd;
  });

  return result.sort((a, b) => b.revenue - a.revenue);
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
