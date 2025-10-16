import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posOrders, posOrderItems } from '@/lib/db/schema';

export async function GET() {
  try {
    // Use raw SQL to avoid Drizzle ORM schema issues
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
      ORDER BY "createdAt" DESC
      LIMIT 100
    `);

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      items,
      totalAmount,
      discountAmount = 0,
      finalAmount,
      customerId,
      riderId,
      orderType = 'dine-in',
      paymentMethod = 'cash',
      transactionId,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create order
    const newOrder = await db.insert(posOrders).values({
      orderNumber,
      customerId,
      riderId,
      totalAmount: totalAmount.toString(),
      discountAmount: discountAmount.toString(),
      finalAmount: finalAmount.toString(),
      orderType,
      paymentMethod,
      transactionId,
      status: 'completed',
    }).returning();

    // Create order items
    await db.insert(posOrderItems).values(
      items.map((item: {productId: number; quantity: number; unitPrice: number; subTotal: number}) => ({
        orderId: newOrder[0].id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        subTotal: item.subTotal.toString(),
      }))
    ).returning();

    // Update daily sales
    const today = new Date().toISOString().split('T')[0];
    await db.execute(`
      INSERT INTO pos_daily_sales (date, total_orders, total_revenue, total_discounts)
      VALUES ('${today}', 1, ${finalAmount}, ${discountAmount})
      ON CONFLICT (date) 
      DO UPDATE SET 
        total_orders = pos_daily_sales.total_orders + 1,
        total_revenue = pos_daily_sales.total_revenue + ${finalAmount},
        total_discounts = pos_daily_sales.total_discounts + ${discountAmount}
    `);

    // Update hourly sales
    const currentHour = new Date().getHours();
    await db.execute(`
      INSERT INTO pos_hourly_sales (date, hour, total_orders, total_revenue)
      VALUES ('${today}', ${currentHour}, 1, ${finalAmount})
      ON CONFLICT (date, hour) 
      DO UPDATE SET 
        total_orders = pos_hourly_sales.total_orders + 1,
        total_revenue = pos_hourly_sales.total_revenue + ${finalAmount}
    `);

    return NextResponse.json({
      success: true,
      orderNumber: newOrder[0].orderNumber,
      orderId: newOrder[0].id,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}