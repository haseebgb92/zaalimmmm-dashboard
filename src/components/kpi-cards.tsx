'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/date-utils';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Calculator, Percent, CreditCard } from 'lucide-react';

interface KPICardsProps {
  kpis: {
    grossSalesTotal: number;
    foodpandaProfitTotal: number;
    spotSalesTotal: number;
    totalSales: number;
    ordersTotal: number;
    expensesTotal: number;
    netProfit: number;
    averageOrderValue: number;
    profitMargin: number;
    foodpandaCommission: number;
  };
  changes?: {
    grossSales: number;
    foodpandaProfit: number;
    spotSales: number;
    totalSales: number;
    orders: number;
    expenses: number;
    netProfit: number;
  };
  currency: string;
}

export function KPICards({ kpis, changes, currency }: KPICardsProps) {
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  const formatChange = (change: number) => {
    if (!change || !isFinite(change)) return null;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 20) return 'text-green-600';
    if (margin >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const cards = [
    {
      title: 'Gross Sales Total',
      value: formatCurrency(kpis.grossSalesTotal, currency),
      icon: DollarSign,
      description: 'Total revenue from all sources',
      change: changes?.grossSales,
    },
    {
      title: 'Foodpanda Profit',
      value: formatCurrency(kpis.foodpandaProfitTotal, currency),
      icon: TrendingUp,
      description: 'Profit from Foodpanda sales',
      change: changes?.foodpandaProfit,
    },
    {
      title: 'Spot Sales Total',
      value: formatCurrency(kpis.spotSalesTotal, currency),
      icon: ShoppingCart,
      description: 'Direct sales revenue',
      change: changes?.spotSales,
    },
    {
      title: 'Total Sales',
      value: formatCurrency(kpis.totalSales, currency),
      icon: DollarSign,
      description: 'Combined profit from all sales',
      change: changes?.totalSales,
    },
    {
      title: 'Profit Margin',
      value: `${kpis.profitMargin.toFixed(1)}%`,
      icon: Percent,
      description: 'Net profit as % of total sales',
      customColor: getProfitMarginColor(kpis.profitMargin),
    },
    {
      title: 'Foodpanda Commission',
      value: formatCurrency(kpis.foodpandaCommission, currency),
      icon: CreditCard,
      description: 'Commission paid to Foodpanda',
    },
    {
      title: 'Expenses Total',
      value: formatCurrency(kpis.expensesTotal, currency),
      icon: TrendingDown,
      description: 'Total expenses incurred',
      change: changes?.expenses,
    },
    {
      title: 'Net Profit',
      value: formatCurrency(kpis.netProfit, currency),
      icon: Calculator,
      description: 'Total profit after expenses',
      isProfit: true,
      change: changes?.netProfit,
    },
    {
      title: 'Orders Total',
      value: kpis.ordersTotal.toLocaleString(),
      icon: Receipt,
      description: 'Total number of orders',
      change: changes?.orders,
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
        const changeValue = card.change;
        const hasChange = changeValue !== undefined && isFinite(changeValue);
        
        return (
          <Card key={card.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.customColor || ''}`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              {hasChange && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${getChangeColor(changeValue)}`}>
                  {getChangeIcon(changeValue)}
                  <span>{formatChange(changeValue)} vs previous period</span>
                </div>
              )}
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
