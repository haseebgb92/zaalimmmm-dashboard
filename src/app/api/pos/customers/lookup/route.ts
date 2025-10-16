import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Find customer by phone number using raw SQL
    const customer = await db.execute(`
      SELECT 
        id,
        name,
        "phoneNumber",
        email,
        address,
        "loyaltyPoints",
        "totalSpent",
        "createdAt",
        "updatedAt"
      FROM pos_customers 
      WHERE "phoneNumber" = '${phone}'
      LIMIT 1
    `);

    if (customer.length === 0) {
      return NextResponse.json({ customer: null, history: [] });
    }

    // Get customer's order history using raw SQL
    const history = await db.execute(`
      SELECT 
        o."orderNumber",
        o."createdAt",
        o."finalAmount",
        o."orderType",
        oi.quantity,
        oi."unitPrice",
        oi."subTotal",
        p.name as product_name,
        p.category as product_category
      FROM pos_orders o
      LEFT JOIN pos_order_items oi ON o.id = oi."orderId"
      LEFT JOIN pos_products p ON oi."productId" = p.id
      WHERE o."customerId" = ${customer[0].id}
      ORDER BY o."createdAt" DESC
      LIMIT 10
    `);

    // Group order items by order
    const groupedHistory = history.reduce((acc: Array<{orderNumber: string; createdAt: Date; finalAmount: string; orderType: string; orderItems: Array<{quantity: number; product: {id: number; name: string}}>}>, row) => {
      const existingOrder = acc.find(order => order.orderNumber === row.orderNumber);
      
      if (existingOrder) {
        if (row.orderItems && row.product) {
          existingOrder.orderItems.push({
            quantity: row.orderItems.quantity,
            product: {
              id: row.product.id,
              name: row.product.name,
            }
          });
        }
      } else {
        acc.push({
          orderNumber: row.orderNumber,
          createdAt: row.createdAt,
          finalAmount: row.finalAmount,
          orderType: row.orderType,
          orderItems: row.orderItems && row.product ? [{
            quantity: row.orderItems.quantity,
            product: {
              id: row.product.id,
              name: row.product.name,
            }
          }] : []
        });
      }
      
      return acc;
    }, []);

    return NextResponse.json({
      customer: customer[0],
      history: groupedHistory,
    });
  } catch (error) {
    console.error('Error looking up customer:', error);
    return NextResponse.json(
      { error: 'Failed to lookup customer' },
      { status: 500 }
    );
  }
}
