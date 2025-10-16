import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIMPLE ORDER CREATION START ===');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { items, totalAmount, finalAmount, orderType = 'takeaway', paymentMethod = 'cash' } = body;
    
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }
    
    // Generate simple order number
    const orderNumber = `ORD-${Date.now()}`;
    console.log('Order number:', orderNumber);
    
    // Test database connection first
    console.log('Testing database connection...');
    const testQuery = await db.execute('SELECT 1 as test');
    console.log('Database test result:', testQuery);
    
    // Create order with minimal data
    console.log('Creating order...');
    const orderResult = await db.execute(`
      INSERT INTO pos_orders (
        "orderNumber", 
        "totalAmount", 
        "discountAmount", 
        "finalAmount", 
        "orderType", 
        "paymentMethod", 
        status, 
        "createdAt", 
        "updatedAt"
      ) VALUES (
        '${orderNumber}', 
        '${totalAmount}', 
        '0', 
        '${finalAmount}', 
        '${orderType}', 
        '${paymentMethod}', 
        'completed', 
        NOW(), 
        NOW()
      ) RETURNING id
    `);
    
    console.log('Order created:', orderResult);
    const orderId = orderResult[0].id;
    
    // Create order items
    console.log('Creating order items...');
    for (const item of items) {
      console.log('Creating item:', item);
      await db.execute(`
        INSERT INTO pos_order_items (
          "orderId", 
          "productId", 
          quantity, 
          "unitPrice", 
          "subTotal", 
          "createdAt", 
          "updatedAt"
        ) VALUES (
          ${orderId}, 
          ${item.productId}, 
          ${item.quantity}, 
          '${item.unitPrice}', 
          '${item.subTotal}', 
          NOW(), 
          NOW()
        )
      `);
    }
    
    // Update customer total spent if customerId is provided
    if (body.customerId) {
      console.log('Updating customer total spent...');
      await db.execute(`
        UPDATE pos_customers 
        SET "totalSpent" = "totalSpent" + ${finalAmount},
            "updatedAt" = NOW()
        WHERE id = ${body.customerId}
      `);
    }
    
    console.log('Order creation completed successfully');
    return NextResponse.json({
      success: true,
      orderNumber,
      orderId,
      message: 'Order created successfully'
    });
    
  } catch (error) {
    console.error('SIMPLE ORDER CREATION ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}