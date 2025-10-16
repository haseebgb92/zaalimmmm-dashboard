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
    
    orders.forEach((row: any) => {
      if (!orderMap.has(row.id)) {
        orderMap.set(row.id, {
          id: row.id,
          orderNumber: row.orderNumber,
          totalAmount: row.totalAmount,
          discountAmount: row.discountAmount,
          finalAmount: row.finalAmount,
          orderType: row.orderType,
          paymentMethod: row.paymentMethod,
          status: row.status,
          createdAt: row.createdAt,
          items: []
        });
        totalSpent += Number(row.finalAmount);
      }
      
      if (row.product_name) {
        orderMap.get(row.id).items.push({
          product_name: row.product_name,
          product_category: row.product_category,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          subTotal: row.subTotal
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
