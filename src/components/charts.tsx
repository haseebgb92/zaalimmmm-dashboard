'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyItemsBreakdown } from '@/components/key-items-breakdown';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { formatCurrency, formatDate } from '@/lib/date-utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DailyData {
  date: string;
  spotSales: number;
  foodpandaSales: number;
  netProfit: number;
  expenses: number;
}

interface ChartsProps {
  dailySeries: DailyData[];
  expensesByItem: Record<string, { total: number; qty: number; unit: string; entries: number }>;
  expenseForecast?: Record<string, { 
    predictedAmount: number; 
    avgPerDay: number; 
    confidence: string;
    factors: string[];
    trend: 'up' | 'down' | 'stable';
  }>;
  currency: string;
}

export function Charts({ dailySeries, expensesByItem, expenseForecast, currency }: ChartsProps) {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: any) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y, currency)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: function(value: any) {
            return formatCurrency(value, currency);
          }
        }
      }
    }
  };

  const netProfitData = {
    labels: dailySeries.map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'Net Profit',
        data: dailySeries.map(d => d.netProfit),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const salesData = {
    labels: dailySeries.map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'Spot Sales',
        data: dailySeries.map(d => d.spotSales),
        backgroundColor: 'rgb(59, 130, 246)',
      },
      {
        label: 'Foodpanda Sales',
        data: dailySeries.map(d => d.foodpandaSales),
        backgroundColor: 'rgb(16, 185, 129)',
      },
    ],
  };

  // Sort expenses by total amount (highest to lowest)
  const sortedExpenses = Object.entries(expensesByItem)
    .sort((a, b) => b[1].total - a[1].total);

  const expensesData = {
    labels: sortedExpenses.map(([item]) => item),
    datasets: [
      {
        label: 'Expense Amount',
        data: sortedExpenses.map(([, data]) => data.total),
        backgroundColor: [
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(147, 51, 234)',
          'rgb(236, 72, 153)',
          'rgb(6, 182, 212)',
          'rgb(132, 204, 22)',
          'rgb(251, 146, 60)',
          'rgb(168, 85, 247)',
        ],
      },
    ],
  };

  const expensesBarOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: any) {
            const itemName = context.label;
            const itemData = expensesByItem[itemName];
            const percentage = ((context.parsed.x / sortedExpenses.reduce((sum, [, data]) => sum + data.total, 0)) * 100).toFixed(1);
            const qtyText = itemData?.qty > 0 ? ` | Qty: ${itemData.qty} ${itemData.unit || ''}` : '';
            const entriesText = itemData?.entries > 1 ? ` | ${itemData.entries} entries` : '';
            return `${itemName}: ${formatCurrency(context.parsed.x, currency)} (${percentage}%)${qtyText}${entriesText}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: function(value: any) {
            return formatCurrency(value, currency);
          }
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Net Profit Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Net Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={netProfitData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Sales Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={salesData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Expenses Bar Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Expenses by Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <Bar data={expensesData} options={expensesBarOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Key Items Breakdown */}
      <KeyItemsBreakdown 
        expensesByItem={expensesByItem}
        expenseForecast={expenseForecast}
        currency={currency}
      />
    </div>
  );
}
