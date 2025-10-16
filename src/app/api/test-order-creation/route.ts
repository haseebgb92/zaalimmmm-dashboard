import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Test order creation with minimal data
    const testOrder = await db.execute(`
      INSERT INTO pos_orders (
        "orderNumber", "customerId", "riderId", "totalAmount", 
        "discountAmount", "finalAmount", "orderType", "paymentMethod", 
        "transactionId", status, "createdAt", "updatedAt"
      ) VALUES (
        'TEST-${Date.now()}', 
        NULL, 
        NULL, 
        '100.00', 
        '0.00', 
        '100.00', 
        'dine-in', 
        'cash', 
        NULL, 
        'completed', 
        NOW(), 
        NOW()
      ) RETURNING id
    `);

    return NextResponse.json({
      success: true,
      message: 'Test order created successfully',
      orderId: testOrder[0].id
    });
  } catch (error) {
    console.error('Test order creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
