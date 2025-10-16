import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Get order details
    const order = await db.execute(`
      SELECT 
        o.*,
        c.name as customer_name,
        c."phoneNumber" as customer_phone,
        c.email as customer_email,
        c.address as customer_address,
        r.name as rider_name,
        r."phoneNumber" as rider_phone
      FROM pos_orders o
      LEFT JOIN pos_customers c ON o."customerId" = c.id
      LEFT JOIN pos_riders r ON o."riderId" = r.id
      WHERE o.id = ${id}
    `);
    
    if (order.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Get order items
    const orderItems = await db.execute(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.category as product_category,
        p.price as product_price
      FROM pos_order_items oi
      LEFT JOIN pos_products p ON oi."productId" = p.id
      WHERE oi."orderId" = ${id}
      ORDER BY oi.id
    `);
    
    return NextResponse.json({
      order: order[0],
      items: orderItems
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    
    // Update order status
    await db.execute(`
      UPDATE pos_orders 
      SET status = '${status}', "updatedAt" = NOW()
      WHERE id = ${id}
    `);
    
    return NextResponse.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
