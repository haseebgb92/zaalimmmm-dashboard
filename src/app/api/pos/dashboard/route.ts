import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get today's orders using raw SQL
    const todayOrders = await db.execute(`
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
      WHERE "createdAt" >= $1
    `, [startOfDay]);

    // Calculate stats
    const todayOrdersCount = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum: number, order: Record<string, unknown>) => sum + Number(order.finalAmount), 0);
    const todayDiscounts = todayOrders.reduce((sum: number, order: Record<string, unknown>) => sum + Number(order.discountAmount), 0);
    const averageOrderValue = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0;

    // Calculate peak hour
    const hourlyStats: { [hour: number]: { orders: number; revenue: number } } = {};
    todayOrders.forEach((order: Record<string, unknown>) => {
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
      todayOrders: todayOrdersCount,
      todayRevenue,
      todayDiscounts,
      averageOrderValue,
      peakHour: peakHour.hour,
      peakHourOrders: peakHour.orders,
      paymentMethods,
    };

    return NextResponse.json({
      stats,
      hourlyData,
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
