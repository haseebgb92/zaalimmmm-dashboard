import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('filter') || 'thisWeek';
    
    // Calculate date range based on filter
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    
    switch (dateFilter) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisWeek':
        startDate = new Date(now);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'previousWeek':
        startDate = new Date(now);
        const prevDayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - prevDayOfWeek - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'custom':
        const customStart = searchParams.get('start');
        const customEnd = searchParams.get('end');
        if (customStart && customEnd) {
          startDate = new Date(customStart);
          endDate = new Date(customEnd);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Default to this week if custom dates not provided
          startDate = new Date(now);
          const dayOfWeek = startDate.getDay();
          startDate.setDate(startDate.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      default:
        startDate = new Date(now);
        const defaultDayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - defaultDayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    // Get orders for the selected date range
    const orders = await db.execute(`
      SELECT 
        id,
        "orderNumber",
        "customerId",
        "riderId",
        "totalAmount",
        "discountAmount",
        "finalAmount",
        status,
        "orderType",
        "paymentMethod",
        "transactionId",
        notes,
        "createdAt",
        "updatedAt"
      FROM pos_orders 
      WHERE "createdAt" >= '${startDate.toISOString()}' 
      AND "createdAt" <= '${endDate.toISOString()}'
    `);
    
    // Get top selling items for the date range
    const topItems = await db.execute(`
      SELECT 
        p.name,
        p.category,
        p.price,
        SUM(oi.quantity) as total_quantity,
        SUM(oi."subTotal") as total_amount,
        COUNT(DISTINCT oi."orderId") as order_count
      FROM pos_order_items oi
      JOIN pos_products p ON oi."productId" = p.id
      JOIN pos_orders o ON oi."orderId" = o.id
      WHERE o."createdAt" >= '${startDate.toISOString()}' 
      AND o."createdAt" <= '${endDate.toISOString()}'
      GROUP BY p.id, p.name, p.category, p.price
      ORDER BY total_quantity DESC
      LIMIT 10
    `);

    // Calculate stats
    const ordersCount = orders.length;
    const totalRevenue = orders.reduce((sum: number, order: Record<string, unknown>) => sum + Number(order.finalAmount), 0);
    const totalDiscounts = orders.reduce((sum: number, order: Record<string, unknown>) => sum + Number(order.discountAmount), 0);
    const averageOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

    // Calculate peak hour
    const hourlyStats: { [hour: number]: { orders: number; revenue: number } } = {};
    orders.forEach((order: Record<string, unknown>) => {
      const hour = new Date(order.createdAt as string).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { orders: 0, revenue: 0 };
      }
      hourlyStats[hour].orders++;
      hourlyStats[hour].revenue += Number(order.finalAmount);
    });

    const peakHour = Object.entries(hourlyStats).reduce((peak, [hour, stats]) => {
      return stats.orders > peak.orders ? { hour: parseInt(hour), orders: stats.orders } : peak;
    }, { hour: 0, orders: 0 });

    // Payment methods breakdown
    const paymentMethods = {
      cash: 0,
      card: 0,
      jazzcash: 0,
      easypaisa: 0,
    };

    todayOrders.forEach((order: Record<string, unknown>) => {
      if (order.paymentMethod && paymentMethods.hasOwnProperty(order.paymentMethod as string)) {
        paymentMethods[order.paymentMethod as keyof typeof paymentMethods]++;
      }
    });

    // Get hourly data for chart
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      orders: hourlyStats[hour]?.orders || 0,
      revenue: hourlyStats[hour]?.revenue || 0,
    }));

    const stats = {
      ordersCount,
      totalRevenue,
      totalDiscounts,
      averageOrderValue,
      peakHour: peakHour.hour,
      peakHourOrders: peakHour.orders,
      paymentMethods,
    };

    return NextResponse.json({
      stats,
      hourlyData,
      topItems,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        filter: dateFilter
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Return empty data if table doesn't exist yet
    if (error instanceof Error && (error.message.includes('does not exist') || error.message.includes('relation') && error.message.includes('does not exist'))) {
      console.log('POS orders table does not exist, returning empty dashboard data');
      return NextResponse.json({
        stats: {
          todayOrders: 0,
          todayRevenue: 0,
          todayDiscounts: 0,
          averageOrderValue: 0,
          peakHour: 0,
          peakHourOrders: 0,
          paymentMethods: { cash: 0, card: 0, jazzcash: 0, easypaisa: 0 },
        },
        hourlyData: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          orders: 0,
          revenue: 0,
        })),
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error',
        needsMigration: true
      },
      { status: 500 }
    );
  }
}
