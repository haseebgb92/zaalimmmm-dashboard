import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    console.log('Testing simple order creation...');
    
    // Test with minimal data
    const orderNumber = `TEST-${Date.now()}`;
    
    console.log('Creating order with number:', orderNumber);
    
    const newOrder = await db.execute(`
      INSERT INTO pos_orders (
        "orderNumber", "customerId", "riderId", "totalAmount", 
        "discountAmount", "finalAmount", "orderType", "paymentMethod", 
        "transactionId", status, "createdAt", "updatedAt"
      ) VALUES (
        '${orderNumber}', 
        NULL, 
        NULL, 
        '100.00', 
        '0.00', 
        '100.00', 
        'takeaway', 
        'cash', 
        NULL, 
        'completed', 
        NOW(), 
        NOW()
      ) RETURNING id
    `);

    console.log('Order created successfully:', newOrder);

    const orderId = newOrder[0].id;
    console.log('Order ID:', orderId);

    // Test creating order item
    const orderItem = await db.execute(`
      INSERT INTO pos_order_items (
        "orderId", "productId", quantity, "unitPrice", "subTotal", "createdAt", "updatedAt"
      ) VALUES (
        ${orderId}, 
        1, 
        1, 
        '100.00', 
        '100.00', 
        NOW(), 
        NOW()
      ) RETURNING id
    `);

    console.log('Order item created successfully:', orderItem);

    return NextResponse.json({
      success: true,
      message: 'Simple order created successfully',
      orderId: orderId,
      orderNumber: orderNumber,
      orderItemId: orderItem[0].id
    });
  } catch (error) {
    console.error('Simple order creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
