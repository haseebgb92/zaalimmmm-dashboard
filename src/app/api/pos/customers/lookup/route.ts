import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posCustomers, posOrders, posOrderItems, posProducts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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

    // Find customer by phone number
    const customer = await db
      .select()
      .from(posCustomers)
      .where(eq(posCustomers.phoneNumber, phone))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ customer: null, history: [] });
    }

    // Get customer's order history
    const history = await db
      .select({
        orderNumber: posOrders.orderNumber,
        createdAt: posOrders.createdAt,
        finalAmount: posOrders.finalAmount,
        orderType: posOrders.orderType,
        orderItems: posOrderItems,
        product: posProducts,
      })
      .from(posOrders)
      .leftJoin(posOrderItems, eq(posOrders.id, posOrderItems.orderId))
      .leftJoin(posProducts, eq(posOrderItems.productId, posProducts.id))
      .where(eq(posOrders.customerId, customer[0].id))
      .orderBy(desc(posOrders.createdAt))
      .limit(10);

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
