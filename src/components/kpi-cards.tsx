'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/date-utils';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Calculator } from 'lucide-react';

interface KPICardsProps {
  kpis: {
    grossSalesTotal: number;
    foodpandaProfitTotal: number;
    spotSalesTotal: number;
    ordersTotal: number;
    expensesTotal: number;
    netProfit: number;
    averageOrderValue: number;
  };
  currency: string;
}

export function KPICards({ kpis, currency }: KPICardsProps) {
  // Calculate Total Sales (Foodpanda Profit + Spot Sales Total)
  const totalSales = kpis.foodpandaProfitTotal + kpis.spotSalesTotal;

  const cards = [
    {
      title: 'Gross Sales Total',
      value: formatCurrency(kpis.grossSalesTotal, currency),
      icon: DollarSign,
      description: 'Total revenue from all sources',
    },
    {
      title: 'Foodpanda Profit',
      value: formatCurrency(kpis.foodpandaProfitTotal, currency),
      icon: TrendingUp,
      description: 'Profit from Foodpanda sales',
    },
    {
      title: 'Spot Sales Total',
      value: formatCurrency(kpis.spotSalesTotal, currency),
      icon: ShoppingCart,
      description: 'Direct sales revenue',
    },
    {
      title: 'Total Sales',
      value: formatCurrency(totalSales, currency),
      icon: DollarSign,
      description: 'Combined profit from all sales',
    },
    {
      title: 'Expenses Total',
      value: formatCurrency(kpis.expensesTotal, currency),
      icon: TrendingDown,
      description: 'Total expenses incurred',
    },
    {
      title: 'Net Profit',
      value: formatCurrency(kpis.netProfit, currency),
      icon: Calculator,
      description: 'Total profit after expenses',
      isProfit: true,
    },
    {
      title: 'Orders Total',
      value: kpis.ordersTotal.toLocaleString(),
      icon: Receipt,
      description: 'Total number of orders',
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(kpis.averageOrderValue, currency),
      icon: DollarSign,
      description: 'Revenue per order',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              {card.isProfit && (
                <div className={`absolute top-0 right-0 w-1 h-full ${
                  kpis.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
