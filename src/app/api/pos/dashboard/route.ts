import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posOrders } from '@/lib/db/schema';
import { gte } from 'drizzle-orm';

export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get today's orders
    const todayOrders = await db
      .select()
      .from(posOrders)
      .where(gte(posOrders.createdAt, startOfDay));

    // Calculate stats
    const todayOrdersCount = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.finalAmount), 0);
    const todayDiscounts = todayOrders.reduce((sum, order) => sum + Number(order.discountAmount), 0);
    const averageOrderValue = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0;

    // Calculate peak hour
    const hourlyStats: { [hour: number]: { orders: number; revenue: number } } = {};
    todayOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
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

    todayOrders.forEach(order => {
      if (order.paymentMethod && paymentMethods.hasOwnProperty(order.paymentMethod)) {
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
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
