import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales, expenses, settings } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    // Use dates as-is since they're already in YYYY-MM-DD format
    const start = startDate;
    const end = endDate;

    // Get settings
    const fpProfitRateSetting = await db.select().from(settings).where(eq(settings.key, 'FP_PROFIT_RATE')).limit(1);
    const fpProfitRate = fpProfitRateSetting[0]?.value ? parseFloat(fpProfitRateSetting[0].value) : 0.70;

    // Get sales data
    const salesData = await db
      .select()
      .from(sales)
      .where(and(gte(sales.date, start), lte(sales.date, end)));

    // Get expenses data
    const expensesData = await db
      .select()
      .from(expenses)
      .where(and(gte(expenses.date, start), lte(expenses.date, end)));

    // Calculate KPIs
    const spotSales = salesData.filter(s => s.source === 'spot');
    const foodpandaSales = salesData.filter(s => s.source === 'foodpanda');

    const grossSalesTotal = salesData.reduce((sum, s) => sum + parseFloat(s.grossAmount), 0);
    const foodpandaProfitTotal = foodpandaSales.reduce((sum, s) => sum + (parseFloat(s.grossAmount) * fpProfitRate), 0);
    const spotSalesTotal = spotSales.reduce((sum, s) => sum + parseFloat(s.grossAmount), 0);
    const ordersTotal = salesData.reduce((sum, s) => sum + s.orders, 0);
    const expensesTotal = expensesData.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const netProfit = spotSalesTotal + foodpandaProfitTotal - expensesTotal;
    const averageOrderValue = ordersTotal > 0 ? grossSalesTotal / ordersTotal : 0;

    // Daily series for charts
    const dailyData = new Map();
    
    // Initialize all dates in range
    let current = dayjs.tz(start, 'Asia/Karachi');
    const endDay = dayjs.tz(end, 'Asia/Karachi');
    
    while (current.isSameOrBefore(endDay, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');
      dailyData.set(dateStr, {
        date: dateStr,
        spotSales: 0,
        foodpandaSales: 0,
        netProfit: 0,
        expenses: 0,
      });
      current = current.add(1, 'day');
    }

    // Populate with actual data
    salesData.forEach(sale => {
      const dateStr = sale.date;
      if (dailyData.has(dateStr)) {
        const data = dailyData.get(dateStr);
        if (sale.source === 'spot') {
          data.spotSales += parseFloat(sale.grossAmount);
        } else {
          data.foodpandaSales += parseFloat(sale.grossAmount);
        }
      }
    });

    expensesData.forEach(expense => {
      const dateStr = expense.date;
      if (dailyData.has(dateStr)) {
        const data = dailyData.get(dateStr);
        data.expenses += parseFloat(expense.amount);
      }
    });

    // Calculate net profit for each day
    dailyData.forEach((data) => {
      const foodpandaProfit = data.foodpandaSales * fpProfitRate;
      data.netProfit = data.spotSales + foodpandaProfit - data.expenses;
    });

    // Expenses by item with detailed information
    const expensesByItem = expensesData.reduce((acc, expense) => {
      const item = expense.item;
      if (!acc[item]) {
        acc[item] = { 
          total: 0, 
          qty: 0, 
          unit: expense.unit || 'units',
          entries: 0
        };
      }
      acc[item].total += parseFloat(expense.amount);
      if (expense.qty) {
        acc[item].qty += parseFloat(expense.qty);
      }
      acc[item].entries += 1;
      return acc;
    }, {} as Record<string, { total: number; qty: number; unit: string; entries: number }>);

    return NextResponse.json({
      kpis: {
        grossSalesTotal,
        foodpandaProfitTotal,
        spotSalesTotal,
        ordersTotal,
        expensesTotal,
        netProfit,
        averageOrderValue,
      },
      dailySeries: Array.from(dailyData.values()),
      expensesByItem,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
