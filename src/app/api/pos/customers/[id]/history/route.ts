import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Get customer's order history
    const orders = await db.execute(`
      SELECT 
        o.id,
        o."orderNumber",
        o."totalAmount",
        o."discountAmount",
        o."finalAmount",
        o."orderType",
        o."paymentMethod",
        o.status,
        o."createdAt",
        oi.quantity,
        oi."unitPrice",
        oi."subTotal",
        p.name as product_name,
        p.category as product_category
      FROM pos_orders o
      LEFT JOIN pos_order_items oi ON o.id = oi."orderId"
      LEFT JOIN pos_products p ON oi."productId" = p.id
      WHERE o."customerId" = ${id}
      ORDER BY o."createdAt" DESC
    `);
    
    // Group orders and calculate totals
    const orderMap = new Map();
    let totalSpent = 0;
    
    orders.forEach((row: Record<string, unknown>) => {
      if (!orderMap.has(row.id as number)) {
        orderMap.set(row.id as number, {
          id: row.id as number,
          orderNumber: row.orderNumber as string,
          totalAmount: row.totalAmount as string,
          discountAmount: row.discountAmount as string,
          finalAmount: row.finalAmount as string,
          orderType: row.orderType as string,
          paymentMethod: row.paymentMethod as string,
          status: row.status as string,
          createdAt: row.createdAt as string,
          items: []
        });
        totalSpent += Number(row.finalAmount);
      }
      
      if (row.product_name) {
        orderMap.get(row.id as number)?.items.push({
          product_name: row.product_name as string,
          product_category: row.product_category as string,
          quantity: row.quantity as number,
          unitPrice: row.unitPrice as string,
          subTotal: row.subTotal as string
        });
      }
    });
    
    const orderHistory = Array.from(orderMap.values());
    
    return NextResponse.json({
      orders: orderHistory,
      totalSpent,
      orderCount: orderHistory.length
    });
  } catch (error) {
    console.error('Error fetching customer history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer history' },
      { status: 500 }
    );
  }
}
