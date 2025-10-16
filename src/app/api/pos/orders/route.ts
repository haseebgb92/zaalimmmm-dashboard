import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Helper to determine the correct business date based on 2 AM cutoff
const getBusinessDate = (timestamp?: string) => {
  const now = timestamp ? dayjs.tz(timestamp, 'Asia/Karachi') : dayjs().tz('Asia/Karachi');
  const cutoffTime = now.hour(2).minute(0).second(0).millisecond(0); // 2 AM PST

  // If current time is before 2 AM, it belongs to the previous business day
  if (now.isBefore(cutoffTime)) {
    return now.subtract(1, 'day').format('YYYY-MM-DD');
  }
  return now.format('YYYY-MM-DD');
};

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user || (user.role !== 'pos' && user.role !== 'admin')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { items, customerName, orderType, paymentMethod } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const orderNumber = `ORD-${Date.now()}`;

    // Determine source based on order type
    const source = orderType === 'delivery' ? 'foodpanda' : 'spot';
    
    // Get business date
    const businessDate = getBusinessDate();

    // Check if sales record already exists for this business day and source
    const existingSales = await db
      .select()
      .from(sales)
      .where(
        and(
          eq(sales.date, businessDate),
          eq(sales.source, source)
        )
      )
      .limit(1);

    if (existingSales.length > 0) {
      // Update existing record
      const updatedSales = await db
        .update(sales)
        .set({
          orders: (existingSales[0].orders || 0) + 1,
          grossAmount: ((existingSales[0].grossAmount || 0) + totalAmount).toString(),
          notes: `Updated via POS - Order #${orderNumber}`,
        })
        .where(
          and(
            eq(sales.date, businessDate),
            eq(sales.source, source)
          )
        )
        .returning();

      console.log(`✅ Updated sales for ${source} on ${businessDate}: +1 order, +PKR ${totalAmount}`);

      return NextResponse.json({
        success: true,
        orderNumber,
        action: 'updated',
        businessDate,
        source,
        totalAmount,
        message: `Order created and sales updated for ${source}`,
      });
    } else {
      // Create new record
      const newSales = await db
        .insert(sales)
        .values({
          date: businessDate,
          source: source,
          orders: 1,
          grossAmount: totalAmount.toString(),
          notes: `Created via POS - Order #${orderNumber}`,
        })
        .returning();

      console.log(`✅ Created new sales record for ${source} on ${businessDate}: 1 order, PKR ${totalAmount}`);

      return NextResponse.json({
        success: true,
        orderNumber,
        action: 'created',
        businessDate,
        source,
        totalAmount,
        message: `Order created and new sales record created for ${source}`,
      });
    }
  } catch (error) {
    console.error('POS Order Error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
