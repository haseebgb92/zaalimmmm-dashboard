import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function POST(request: NextRequest) {
  try {
    // Get yesterday's business date (since we run at midnight)
    const yesterday = dayjs().tz('Asia/Karachi').subtract(1, 'day').format('YYYY-MM-DD');
    
    console.log(`🔄 Starting daily sync for business date: ${yesterday}`);

    // Get all sales records for yesterday
    const salesRecords = await db
      .select()
      .from(sales)
      .where(eq(sales.date, yesterday));

    if (salesRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sales data to sync for yesterday',
        businessDate: yesterday,
        recordsCount: 0,
      });
    }

    // Calculate totals
    const totalOrders = salesRecords.reduce((sum, record) => sum + (record.orders || 0), 0);
    const totalRevenue = salesRecords.reduce((sum, record) => sum + Number(record.grossAmount || 0), 0);
    
    const spotSales = salesRecords.filter(record => record.source === 'spot');
    const foodpandaSales = salesRecords.filter(record => record.source === 'foodpanda');
    
    const spotOrders = spotSales.reduce((sum, record) => sum + (record.orders || 0), 0);
    const spotRevenue = spotSales.reduce((sum, record) => sum + Number(record.grossAmount || 0), 0);
    
    const foodpandaOrders = foodpandaSales.reduce((sum, record) => sum + (record.orders || 0), 0);
    const foodpandaRevenue = foodpandaSales.reduce((sum, record) => sum + Number(record.grossAmount || 0), 0);

    console.log(`📊 Daily sync summary for ${yesterday}:`);
    console.log(`   Total Orders: ${totalOrders}`);
    console.log(`   Total Revenue: PKR ${totalRevenue}`);
    console.log(`   Spot Orders: ${spotOrders} (PKR ${spotRevenue})`);
    console.log(`   Foodpanda Orders: ${foodpandaOrders} (PKR ${foodpandaRevenue})`);

    return NextResponse.json({
      success: true,
      message: 'Daily sync completed successfully',
      businessDate: yesterday,
      summary: {
        totalOrders,
        totalRevenue,
        spotOrders,
        spotRevenue,
        foodpandaOrders,
        foodpandaRevenue,
      },
      recordsCount: salesRecords.length,
    });

  } catch (error) {
    console.error('❌ Daily sync error:', error);
    return NextResponse.json(
      { 
        error: 'Daily sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get yesterday's business date
    const yesterday = dayjs().tz('Asia/Karachi').subtract(1, 'day').format('YYYY-MM-DD');
    
    // Get sales records for yesterday
    const salesRecords = await db
      .select()
      .from(sales)
      .where(eq(sales.date, yesterday));

    const totalOrders = salesRecords.reduce((sum, record) => sum + (record.orders || 0), 0);
    const totalRevenue = salesRecords.reduce((sum, record) => sum + Number(record.grossAmount || 0), 0);
    
    const spotSales = salesRecords.filter(record => record.source === 'spot');
    const foodpandaSales = salesRecords.filter(record => record.source === 'foodpanda');
    
    const spotOrders = spotSales.reduce((sum, record) => sum + (record.orders || 0), 0);
    const spotRevenue = spotSales.reduce((sum, record) => sum + Number(record.grossAmount || 0), 0);
    
    const foodpandaOrders = foodpandaSales.reduce((sum, record) => sum + (record.orders || 0), 0);
    const foodpandaRevenue = foodpandaSales.reduce((sum, record) => sum + Number(record.grossAmount || 0), 0);

    return NextResponse.json({
      success: true,
      businessDate: yesterday,
      summary: {
        totalOrders,
        totalRevenue,
        spotOrders,
        spotRevenue,
        foodpandaOrders,
        foodpandaRevenue,
      },
      recordsCount: salesRecords.length,
    });

  } catch (error) {
    console.error('❌ Daily sync status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get daily sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
