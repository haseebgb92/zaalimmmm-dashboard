import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { posDailyClosing, posDailyClosingLogs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    // Get existing daily closing record
    const existingClosing = await db
      .select()
      .from(posDailyClosing)
      .where(eq(posDailyClosing.date, date))
      .limit(1)

    if (existingClosing.length > 0) {
      return NextResponse.json(existingClosing[0])
    }

    // If no existing record, calculate totals from orders for the day using raw SQL
    let orders: { finalAmount: string | number; paymentMethod?: string }[] = []
    try {
      orders = await db.execute(`
        SELECT "finalAmount", "paymentMethod"
        FROM pos_orders 
        WHERE DATE("createdAt") = '${date}'
        ORDER BY "createdAt" DESC
      `)
    } catch {
      console.log('Orders table query failed, using empty totals')
      orders = []
    }

    // Calculate totals by payment method
    const totals = {
      cash: 0,
      card: 0,
      jazzcash: 0,
      easypaisa: 0,
      credit: 0
    }

    orders.forEach((order) => {
      const typedOrder = order as { finalAmount: string | number; paymentMethod?: string }
      const amount = parseFloat(typedOrder.finalAmount.toString())
      const method = typedOrder.paymentMethod || 'cash'
      
      if (method in totals) {
        totals[method as keyof typeof totals] += amount
      }
    })

    // Return calculated data for new daily closing
    return NextResponse.json({
      date,
      agentId: 1,
      agentName: '',
      totalCashOrders: totals.cash,
      totalCardOrders: totals.card,
      totalJazzcashOrders: totals.jazzcash,
      totalEasypaisaOrders: totals.easypaisa,
      totalCreditOrders: totals.credit,
      cashReceived: 0,
      currencyNotes5000: 0,
      currencyNotes1000: 0,
      currencyNotes500: 0,
      currencyNotes100: 0,
      currencyNotes50: 0,
      currencyNotes20: 0,
      currencyNotes10: 0,
      calculatedCashTotal: 0,
      cashDifference: 0,
      status: 'pending',
      notes: ''
    })

  } catch (error) {
    console.error('Error fetching daily closing data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily closing data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      date,
      agentId,
      agentName,
      totalCashOrders,
      totalCardOrders,
      totalJazzcashOrders,
      totalEasypaisaOrders,
      totalCreditOrders,
      cashReceived,
      currencyNotes5000,
      currencyNotes1000,
      currencyNotes500,
      currencyNotes100,
      currencyNotes50,
      currencyNotes20,
      currencyNotes10,
      calculatedCashTotal,
      cashDifference,
      status,
      notes
    } = body

    // Check if record already exists for this date
    const existingClosing = await db
      .select()
      .from(posDailyClosing)
      .where(eq(posDailyClosing.date, date))
      .limit(1)

    if (existingClosing.length > 0) {
      return NextResponse.json(
        { error: 'Daily closing record already exists for this date. Use PUT to update.' },
        { status: 400 }
      )
    }

    // Create new daily closing record
    const newClosing = await db
      .insert(posDailyClosing)
      .values({
        date,
        agentId,
        agentName,
        totalCashOrders: totalCashOrders.toString(),
        totalCardOrders: totalCardOrders.toString(),
        totalJazzcashOrders: totalJazzcashOrders.toString(),
        totalEasypaisaOrders: totalEasypaisaOrders.toString(),
        totalCreditOrders: totalCreditOrders.toString(),
        cashReceived: cashReceived.toString(),
        currencyNotes5000,
        currencyNotes1000,
        currencyNotes500,
        currencyNotes100,
        currencyNotes50,
        currencyNotes20,
        currencyNotes10,
        calculatedCashTotal: calculatedCashTotal.toString(),
        cashDifference: cashDifference.toString(),
        status,
        notes
      })
      .returning()

    // Log the creation
    await db.insert(posDailyClosingLogs).values({
      closingId: newClosing[0].id,
      action: 'created',
      details: `Daily closing created for ${date}`,
      performedBy: agentName
    })

    return NextResponse.json(newClosing[0])

  } catch (error) {
    console.error('Error creating daily closing:', error)
    return NextResponse.json(
      { error: 'Failed to create daily closing record' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      date,
      agentId,
      agentName,
      totalCashOrders,
      totalCardOrders,
      totalJazzcashOrders,
      totalEasypaisaOrders,
      totalCreditOrders,
      cashReceived,
      currencyNotes5000,
      currencyNotes1000,
      currencyNotes500,
      currencyNotes100,
      currencyNotes50,
      currencyNotes20,
      currencyNotes10,
      calculatedCashTotal,
      cashDifference,
      status,
      notes
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 })
    }

    // Update existing daily closing record
    const updatedClosing = await db
      .update(posDailyClosing)
      .set({
        agentId,
        agentName,
        totalCashOrders: totalCashOrders.toString(),
        totalCardOrders: totalCardOrders.toString(),
        totalJazzcashOrders: totalJazzcashOrders.toString(),
        totalEasypaisaOrders: totalEasypaisaOrders.toString(),
        totalCreditOrders: totalCreditOrders.toString(),
        cashReceived: cashReceived.toString(),
        currencyNotes5000,
        currencyNotes1000,
        currencyNotes500,
        currencyNotes100,
        currencyNotes50,
        currencyNotes20,
        currencyNotes10,
        calculatedCashTotal: calculatedCashTotal.toString(),
        cashDifference: cashDifference.toString(),
        status,
        notes,
        updatedAt: new Date()
      })
      .where(eq(posDailyClosing.id, id))
      .returning()

    if (updatedClosing.length === 0) {
      return NextResponse.json(
        { error: 'Daily closing record not found' },
        { status: 404 }
      )
    }

    // Log the update
    await db.insert(posDailyClosingLogs).values({
      closingId: id,
      action: status === 'completed' ? 'completed' : 'updated',
      details: status === 'completed' ? `Daily closing completed for ${date}` : `Daily closing updated for ${date}`,
      performedBy: agentName
    })

    return NextResponse.json(updatedClosing[0])

  } catch (error) {
    console.error('Error updating daily closing:', error)
    return NextResponse.json(
      { error: 'Failed to update daily closing record' },
      { status: 500 }
    )
  }
}
