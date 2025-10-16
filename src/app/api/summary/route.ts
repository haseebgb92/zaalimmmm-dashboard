import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales, expenses, settings } from '@/lib/db/schema';
import { eq, and, gte, lte, lt } from 'drizzle-orm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { handleCors, addCorsHeaders } from '@/lib/cors';

// Seasonal multiplier function for expense forecasting
function getSeasonalMultiplier(item: string, month: number): number {
  const itemLower = item.toLowerCase();
  
  // Summer months (May-August) - higher demand for cold items
  if (month >= 4 && month <= 7) {
    if (itemLower.includes('chicken') || itemLower.includes('meat')) return 1.1;
    if (itemLower.includes('vegetable') || itemLower.includes('salad')) return 1.2;
    if (itemLower.includes('ice') || itemLower.includes('cold')) return 1.3;
  }
  
  // Winter months (Nov-Feb) - higher demand for warm items
  if (month >= 10 || month <= 1) {
    if (itemLower.includes('chicken') || itemLower.includes('meat')) return 1.2;
    if (itemLower.includes('bread') || itemLower.includes('warm')) return 1.1;
  }
  
  // Ramadan/Eid periods (approximate)
  if (month === 2 || month === 3) { // March-April
    if (itemLower.includes('chicken') || itemLower.includes('meat')) return 1.4;
    if (itemLower.includes('vegetable')) return 1.3;
  }
  
  return 1.0; // No seasonal adjustment
}

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) {
    console.log('CORS preflight handled');
    return corsResponse;
  }

  console.log('Summary API called:', {
    method: request.method,
    origin: request.headers.get('origin'),
    url: request.url,
  });

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
    const totalSales = foodpandaProfitTotal + spotSalesTotal;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
    const foodpandaCommission = foodpandaSales.reduce((sum, s) => sum + (parseFloat(s.grossAmount) * (1 - fpProfitRate)), 0);

    // Calculate previous period data for comparison
    const daysDifference = dayjs(end).diff(dayjs(start), 'day') + 1;
    const prevStart = dayjs(start).subtract(daysDifference, 'day').format('YYYY-MM-DD');
    const prevEnd = dayjs(start).subtract(1, 'day').format('YYYY-MM-DD');

    const prevSalesData = await db
      .select()
      .from(sales)
      .where(and(gte(sales.date, prevStart), lte(sales.date, prevEnd)));

    const prevExpensesData = await db
      .select()
      .from(expenses)
      .where(and(gte(expenses.date, prevStart), lte(expenses.date, prevEnd)));

    const prevSpotSales = prevSalesData.filter(s => s.source === 'spot');
    const prevFoodpandaSales = prevSalesData.filter(s => s.source === 'foodpanda');
    
    const prevGrossSalesTotal = prevSalesData.reduce((sum, s) => sum + parseFloat(s.grossAmount), 0);
    const prevFoodpandaProfitTotal = prevFoodpandaSales.reduce((sum, s) => sum + (parseFloat(s.grossAmount) * fpProfitRate), 0);
    const prevSpotSalesTotal = prevSpotSales.reduce((sum, s) => sum + parseFloat(s.grossAmount), 0);
    const prevOrdersTotal = prevSalesData.reduce((sum, s) => sum + s.orders, 0);
    const prevExpensesTotal = prevExpensesData.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const prevNetProfit = prevSpotSalesTotal + prevFoodpandaProfitTotal - prevExpensesTotal;
    const prevTotalSales = prevFoodpandaProfitTotal + prevSpotSalesTotal;

    // Calculate percentage changes
    const changes = {
      grossSales: prevGrossSalesTotal > 0 ? ((grossSalesTotal - prevGrossSalesTotal) / prevGrossSalesTotal) * 100 : 0,
      foodpandaProfit: prevFoodpandaProfitTotal > 0 ? ((foodpandaProfitTotal - prevFoodpandaProfitTotal) / prevFoodpandaProfitTotal) * 100 : 0,
      spotSales: prevSpotSalesTotal > 0 ? ((spotSalesTotal - prevSpotSalesTotal) / prevSpotSalesTotal) * 100 : 0,
      totalSales: prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0,
      orders: prevOrdersTotal > 0 ? ((ordersTotal - prevOrdersTotal) / prevOrdersTotal) * 100 : 0,
      expenses: prevExpensesTotal > 0 ? ((expensesTotal - prevExpensesTotal) / prevExpensesTotal) * 100 : 0,
      netProfit: prevNetProfit !== 0 ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100 : 0,
    };

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

    // Enhanced expense forecast calculation
    const expenseForecast: Record<string, { 
      predictedAmount: number; 
      avgPerDay: number; 
      confidence: string;
      factors: string[];
      trend: 'up' | 'down' | 'stable';
    }> = {};

    // Get historical data for better forecasting (last 30 days)
    const historicalStart = new Date(new Date(start).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const historicalExpenses = await db
      .select()
      .from(expenses)
      .where(and(gte(expenses.date, historicalStart), lt(expenses.date, start)));

    // Calculate sales trend for demand-based forecasting
    const currentPeriodSales = grossSalesTotal;
    const salesGrowthRate = prevGrossSalesTotal > 0 ? 
      ((currentPeriodSales - prevGrossSalesTotal) / prevGrossSalesTotal) * 100 : 0;

    Object.entries(expensesByItem).forEach(([item, data]) => {
      const currentAvgPerDay = data.total / daysDifference;
      
      // Historical analysis
      const historicalItemData = historicalExpenses.filter(e => e.item === item);
      const historicalAvgPerDay = historicalItemData.length > 0 ? 
        historicalItemData.reduce((sum, e) => sum + parseFloat(e.amount), 0) / 30 : currentAvgPerDay;
      
      // Calculate trend
      const trendChange = ((currentAvgPerDay - historicalAvgPerDay) / historicalAvgPerDay) * 100;
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (trendChange > 10) trend = 'up';
      else if (trendChange < -10) trend = 'down';
      
      // Sales-based demand adjustment
      const demandMultiplier = 1 + (salesGrowthRate / 100) * 0.3; // 30% correlation with sales growth
      
      // Seasonal adjustment (basic - can be enhanced)
      const currentMonth = new Date(start).getMonth();
      const seasonalMultiplier = getSeasonalMultiplier(item, currentMonth);
      
      // Final prediction with multiple factors
      const basePrediction = currentAvgPerDay * daysDifference;
      const adjustedPrediction = basePrediction * demandMultiplier * seasonalMultiplier;
      
      // Confidence calculation
      let confidence = 'medium';
      const dataPoints = data.entries;
      if (dataPoints >= 7 && Math.abs(trendChange) < 20) confidence = 'high';
      else if (dataPoints < 3 || Math.abs(trendChange) > 50) confidence = 'low';
      
      // Factors explanation
      const factors: string[] = [];
      if (Math.abs(salesGrowthRate) > 5) factors.push(`Sales ${salesGrowthRate > 0 ? 'growth' : 'decline'} (${salesGrowthRate.toFixed(1)}%)`);
      if (Math.abs(trendChange) > 10) factors.push(`Spending ${trendChange > 0 ? 'increasing' : 'decreasing'} (${trendChange.toFixed(1)}%)`);
      if (seasonalMultiplier !== 1) factors.push('Seasonal adjustment');
      if (dataPoints < 5) factors.push('Limited data points');
      
      expenseForecast[item] = {
        predictedAmount: Math.round(adjustedPrediction),
        avgPerDay: Math.round(currentAvgPerDay * 100) / 100,
        confidence,
        factors,
        trend,
      };
    });

    const response = NextResponse.json({
      kpis: {
        grossSalesTotal,
        foodpandaProfitTotal,
        spotSalesTotal,
        totalSales,
        ordersTotal,
        expensesTotal,
        netProfit,
        averageOrderValue,
        profitMargin,
        foodpandaCommission,
      },
      changes,
      previousPeriod: {
        start: prevStart,
        end: prevEnd,
      },
      dailySeries: Array.from(dailyData.values()),
      expensesByItem,
      expenseForecast,
    });
    
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Error fetching summary:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}
