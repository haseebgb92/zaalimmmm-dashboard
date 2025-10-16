import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('=== FIXED ORDER CREATION START ===');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { items, totalAmount, finalAmount, orderType = 'takeaway', paymentMethod = 'cash', customerId } = body;
    
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }
    
    // Generate simple order number
    const orderNumber = `ORD-${Date.now()}`;
    console.log('Order number:', orderNumber);
    
    // Create order with minimal required fields only
    console.log('Creating order...');
    const orderResult = await db.execute(`
      INSERT INTO pos_orders (
        "orderNumber", 
        "totalAmount", 
        "discountAmount", 
        "finalAmount", 
        "orderType", 
        "paymentMethod", 
        status
      ) VALUES (
        '${orderNumber}', 
        ${totalAmount}, 
        0, 
        ${finalAmount}, 
        '${orderType}', 
        '${paymentMethod}', 
        'completed'
      ) RETURNING id
    `);
    
    console.log('Order created:', orderResult);
    const orderId = orderResult[0].id;
    
    // Create order items with proper error handling
    console.log('Creating order items...');
    for (const item of items) {
      console.log('Creating item:', item);
      try {
        await db.execute(`
          INSERT INTO pos_order_items (
            "orderId", 
            "productId", 
            quantity, 
            "unitPrice", 
            "subTotal"
          ) VALUES (
            ${orderId}, 
            ${item.productId}, 
            ${item.quantity}, 
            ${item.unitPrice}, 
            ${item.subTotal}
          )
        `);
        console.log('Item created successfully');
      } catch (itemError) {
        console.error('Error creating item:', itemError);
        // Continue with other items even if one fails
      }
    }
    
    // Update customer total spent if customerId is provided
    if (customerId) {
      console.log('Updating customer total spent...');
      try {
        await db.execute(`
          UPDATE pos_customers 
          SET "totalSpent" = "totalSpent" + ${finalAmount}
          WHERE id = ${customerId}
        `);
        console.log('Customer total updated');
      } catch (customerError) {
        console.error('Error updating customer total:', customerError);
        // Don't fail the order if customer update fails
      }
    }
    
    console.log('Order creation completed successfully');
    return NextResponse.json({
      success: true,
      orderNumber,
      orderId,
      message: 'Order created successfully'
    });
    
  } catch (error) {
    console.error('FIXED ORDER CREATION ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Order creation failed'
    }, { status: 500 });
  }
}
