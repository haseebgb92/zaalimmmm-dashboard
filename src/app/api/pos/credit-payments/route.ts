import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { posOrders } from '@/lib/db/schema'
import { eq, and, gte, lt, desc } from 'drizzle-orm'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paidBy } = body

    if (!orderId || !paidBy) {
      return NextResponse.json(
        { error: 'Order ID and paid by information are required' },
        { status: 400 }
      )
    }

    // Update the order to mark credit as paid
    const updatedOrder = await db
      .update(posOrders)
      .set({
        creditPaid: true,
        creditPaidAt: new Date(),
        creditPaidBy: paidBy,
        updatedAt: new Date()
      })
      .where(eq(posOrders.id, orderId))
      .returning()

    if (updatedOrder.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder[0],
      message: 'Credit payment marked as paid successfully'
    })

  } catch (error) {
    console.error('Error marking credit payment:', error)
    return NextResponse.json(
      { error: 'Failed to mark credit payment' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'unpaid' or 'paid'
    const date = searchParams.get('date')

    const whereConditions = [eq(posOrders.paymentMethod, 'credit')]

    if (status === 'unpaid') {
      whereConditions.push(eq(posOrders.creditPaid, false))
    } else if (status === 'paid') {
      whereConditions.push(eq(posOrders.creditPaid, true))
    }

    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z')
      const endOfDay = new Date(date + 'T23:59:59.999Z')
      whereConditions.push(gte(posOrders.createdAt, startOfDay))
      whereConditions.push(lt(posOrders.createdAt, endOfDay))
    }

    const orders = await db
      .select()
      .from(posOrders)
      .where(and(...whereConditions))
      .orderBy(desc(posOrders.createdAt))

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length
    })

  } catch (error) {
    console.error('Error fetching credit orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit orders' },
      { status: 500 }
    )
  }
}
