import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    console.log(`Fetching daily closing data for date: ${date}`)

    // Always calculate real-time totals from orders for the day
    let orders: { finalAmount: string | number; paymentMethod?: string; creditPaid?: boolean }[] = []
    try {
      orders = await db.execute(`
        SELECT "finalAmount", "paymentMethod", "creditPaid"
        FROM pos_orders 
        WHERE DATE("createdAt") = '${date}'
        ORDER BY "createdAt" DESC
      `)
      console.log(`Found ${orders.length} orders for ${date}`)
    } catch {
      console.log('Orders table query failed, using empty totals')
      orders = []
    }

    // Calculate real-time totals by payment method
    // IMPORTANT: Paid credit orders should be counted as CASH for daily closing
    const totals = {
      cash: 0,
      card: 0,
      jazzcash: 0,
      easypaisa: 0,
      credit: 0
    }

    orders.forEach((order) => {
      const typedOrder = order as { finalAmount: string | number; paymentMethod?: string; creditPaid?: boolean }
      const amount = parseFloat(typedOrder.finalAmount.toString())
      const method = typedOrder.paymentMethod || 'cash'
      const isCreditPaid = typedOrder.creditPaid || false
      
      // If it's a credit order that has been paid, count it as cash
      if (method === 'credit' && isCreditPaid) {
        totals.cash += amount
      } else if (method in totals) {
        totals[method as keyof typeof totals] += amount
      }
    })

    console.log('Calculated totals:', totals)

    // Get existing daily closing record for manual entries (cash received, currency notes)
    let existingClosing = null
    try {
      const existing = await db.execute(`
        SELECT * FROM pos_daily_closing 
        WHERE date = '${date}' 
        LIMIT 1
      `)
      
      if (existing.length > 0) {
        existingClosing = existing[0]
      }
    } catch {
      console.log('Daily closing table query failed, using defaults')
    }

    // Return real-time data with manual entries if they exist
    const response = {
      id: existingClosing?.id || null,
      date,
      agentId: existingClosing?.agentId || 1,
      agentName: existingClosing?.agentName || '',
      totalCashOrders: totals.cash,
      totalCardOrders: totals.card,
      totalJazzcashOrders: totals.jazzcash,
      totalEasypaisaOrders: totals.easypaisa,
      totalCreditOrders: totals.credit,
      cashReceived: existingClosing?.cashReceived || 0,
      currencyNotes5000: existingClosing?.currencyNotes5000 || 0,
      currencyNotes1000: existingClosing?.currencyNotes1000 || 0,
      currencyNotes500: existingClosing?.currencyNotes500 || 0,
      currencyNotes100: existingClosing?.currencyNotes100 || 0,
      currencyNotes50: existingClosing?.currencyNotes50 || 0,
      currencyNotes20: existingClosing?.currencyNotes20 || 0,
      currencyNotes10: existingClosing?.currencyNotes10 || 0,
      calculatedCashTotal: existingClosing?.calculatedCashTotal || 0,
      cashDifference: existingClosing?.cashDifference || 0,
      status: existingClosing?.status || 'pending',
      notes: existingClosing?.notes || '',
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(response)

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

    console.log(`Creating daily closing record for date: ${date}`)

    try {
      // Check if record already exists for this date
      const existingClosing = await db.execute(`
        SELECT * FROM pos_daily_closing 
        WHERE date = '${date}' 
        LIMIT 1
      `)

      if (existingClosing.length > 0) {
        return NextResponse.json(
          { error: 'Daily closing record already exists for this date. Use PUT to update.' },
          { status: 400 }
        )
      }

      // Create new daily closing record
      const newClosing = await db.execute(`
        INSERT INTO pos_daily_closing (
          date, agent_id, agent_name, total_cash_orders, total_card_orders,
          total_jazzcash_orders, total_easypaisa_orders, total_credit_orders,
          cash_received, currency_notes_5000, currency_notes_1000, currency_notes_500,
          currency_notes_100, currency_notes_50, currency_notes_20, currency_notes_10,
          calculated_cash_total, cash_difference, status, notes, created_at, updated_at
        ) VALUES (
          '${date}', ${agentId || 1}, '${(agentName || 'Unknown').replace(/'/g, "''")}',
          '${totalCashOrders || 0}', '${totalCardOrders || 0}',
          '${totalJazzcashOrders || 0}', '${totalEasypaisaOrders || 0}',
          '${totalCreditOrders || 0}', '${cashReceived || 0}',
          ${currencyNotes5000 || 0}, ${currencyNotes1000 || 0},
          ${currencyNotes500 || 0}, ${currencyNotes100 || 0},
          ${currencyNotes50 || 0}, ${currencyNotes20 || 0},
          ${currencyNotes10 || 0}, '${calculatedCashTotal || 0}',
          '${cashDifference || 0}', '${status || 'pending'}',
          '${(notes || '').replace(/'/g, "''")}', NOW(), NOW()
        )
        RETURNING *
      `)

      // Log the creation
      try {
        await db.execute(`
          INSERT INTO pos_daily_closing_logs (closing_id, action, details, performed_by, created_at)
          VALUES (${newClosing[0].id}, 'created', 'Daily closing created for ${date}', '${agentName || 'Unknown'}', NOW())
        `)
      } catch (logError) {
        console.log('Failed to log creation:', logError)
      }

      return NextResponse.json(newClosing[0])

    } catch (dbError) {
      console.log('Database operation failed:', dbError)
      return NextResponse.json(
        { error: 'Database operation failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      )
    }

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

    console.log(`Updating daily closing record with ID: ${id}`)

    try {
      // Update existing daily closing record
      const updatedClosing = await db.execute(`
        UPDATE pos_daily_closing SET
          agent_id = ${agentId || 1},
          agent_name = '${(agentName || 'Unknown').replace(/'/g, "''")}',
          total_cash_orders = '${totalCashOrders || 0}',
          total_card_orders = '${totalCardOrders || 0}',
          total_jazzcash_orders = '${totalJazzcashOrders || 0}',
          total_easypaisa_orders = '${totalEasypaisaOrders || 0}',
          total_credit_orders = '${totalCreditOrders || 0}',
          cash_received = '${cashReceived || 0}',
          currency_notes_5000 = ${currencyNotes5000 || 0},
          currency_notes_1000 = ${currencyNotes1000 || 0},
          currency_notes_500 = ${currencyNotes500 || 0},
          currency_notes_100 = ${currencyNotes100 || 0},
          currency_notes_50 = ${currencyNotes50 || 0},
          currency_notes_20 = ${currencyNotes20 || 0},
          currency_notes_10 = ${currencyNotes10 || 0},
          calculated_cash_total = '${calculatedCashTotal || 0}',
          cash_difference = '${cashDifference || 0}',
          status = '${status || 'pending'}',
          notes = '${(notes || '').replace(/'/g, "''")}',
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `)

      if (updatedClosing.length === 0) {
        return NextResponse.json(
          { error: 'Daily closing record not found' },
          { status: 404 }
        )
      }

      // Log the update
      try {
        await db.execute(`
          INSERT INTO pos_daily_closing_logs (closing_id, action, details, performed_by, created_at)
          VALUES (${id}, '${status === 'completed' ? 'completed' : 'updated'}', 
                  '${status === 'completed' ? `Daily closing completed for ${date}` : `Daily closing updated for ${date}`}', 
                  '${agentName || 'Unknown'}', NOW())
        `)
      } catch (logError) {
        console.log('Failed to log update:', logError)
      }

      return NextResponse.json(updatedClosing[0])

    } catch (dbError) {
      console.log('Database update failed:', dbError)
      return NextResponse.json(
        { error: 'Database update failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error updating daily closing:', error)
    return NextResponse.json(
      { error: 'Failed to update daily closing record' },
      { status: 500 }
    )
  }
}
