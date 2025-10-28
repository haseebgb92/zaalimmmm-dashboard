import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    console.log('=== ORDER CREATION START ===');
    const body = await request.json();
    console.log('Request body:', body);
    
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
    
    console.log('Parsed data:', {
      items: items?.length,
      totalAmount,
      discountAmount,
      finalAmount,
      customerId,
      riderId,
      orderType,
      paymentMethod,
      transactionId
    });

    if (!items || items.length === 0) {
      console.log('ERROR: No items provided');
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    console.log('Generated order number:', orderNumber);

    // Create order using raw SQL with proper escaping
    console.log('Creating order in database...');
    const orderSQL = `
      INSERT INTO pos_orders (
        "orderNumber", "customerId", "riderId", "totalAmount", 
        "discountAmount", "finalAmount", "orderType", "paymentMethod", 
        "transactionId", status, "createdAt", "updatedAt"
      ) VALUES (
        '${orderNumber.replace(/'/g, "\'")}', 
        ${customerId || 'NULL'}, 
        ${riderId || 'NULL'}, 
        '${totalAmount.toString()}', 
        '${discountAmount.toString()}', 
        '${finalAmount.toString()}', 
        '${orderType.replace(/'/g, "\'")}', 
        '${paymentMethod.replace(/'/g, "\'")}', 
        ${transactionId ? `'${transactionId.replace(/'/g, "\'")}'` : 'NULL'}, 
        'completed', 
        NOW(), 
        NOW()
      ) RETURNING id
    `;
    
    console.log('Order SQL:', orderSQL);
    const newOrder = await db.execute(orderSQL);

    const orderId = newOrder[0].id;
    console.log('Order created with ID:', orderId);

    // Create order items using raw SQL
    console.log('Creating order items...');
    for (const item of items) {
      console.log('Creating item:', item);
      const itemSQL = `
        INSERT INTO pos_order_items (
          "orderId", "productId", quantity, "unitPrice", "subTotal", "createdAt", "updatedAt"
        ) VALUES (
          ${orderId}, 
          ${item.productId}, 
          ${item.quantity}, 
          '${item.unitPrice.toString()}', 
          '${item.subTotal.toString()}', 
          NOW(), 
          NOW()
        )
      `;
      console.log('Item SQL:', itemSQL);
      await db.execute(itemSQL);
    }

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

    console.log('Order creation completed successfully');
    return NextResponse.json({
      success: true,
      orderNumber: orderNumber,
      orderId: orderId,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}