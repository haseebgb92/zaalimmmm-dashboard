import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { posDailyClosing, posDailyClosingLogs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, agentName, notes } = body
    
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    console.log(`Completing daily closing for date: ${date}`)

    // Get current day's data
    const orders = await db.execute(`
      SELECT "finalAmount", "paymentMethod"
      FROM pos_orders 
      WHERE DATE("createdAt") = '${date}'
      ORDER BY "createdAt" DESC
    `)

    // Calculate final totals
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

    // Create or update daily closing record
    const closingData = {
      date,
      agentId: 1,
      agentName: agentName || 'Unknown',
      totalCashOrders: totals.cash.toString(),
      totalCardOrders: totals.card.toString(),
      totalJazzcashOrders: totals.jazzcash.toString(),
      totalEasypaisaOrders: totals.easypaisa.toString(),
      totalCreditOrders: totals.credit.toString(),
      cashReceived: '0',
      currencyNotes5000: 0,
      currencyNotes1000: 0,
      currencyNotes500: 0,
      currencyNotes100: 0,
      currencyNotes50: 0,
      currencyNotes20: 0,
      currencyNotes10: 0,
      calculatedCashTotal: '0',
      cashDifference: '0',
      status: 'completed',
      notes: notes || `Daily closing completed for ${date}`
    }

    // Insert or update the daily closing record
    const result = await db.execute(`
      INSERT INTO pos_daily_closing (
        date, agent_id, agent_name, total_cash_orders, total_card_orders,
        total_jazzcash_orders, total_easypaisa_orders, total_credit_orders,
        cash_received, currency_notes_5000, currency_notes_1000, currency_notes_500,
        currency_notes_100, currency_notes_50, currency_notes_20, currency_notes_10,
        calculated_cash_total, cash_difference, status, notes, created_at, updated_at
      ) VALUES (
        '${date}', ${closingData.agentId}, '${closingData.agentName.replace(/'/g, "''")}',
        '${closingData.totalCashOrders}', '${closingData.totalCardOrders}',
        '${closingData.totalJazzcashOrders}', '${closingData.totalEasypaisaOrders}',
        '${closingData.totalCreditOrders}', '${closingData.cashReceived}',
        ${closingData.currencyNotes5000}, ${closingData.currencyNotes1000},
        ${closingData.currencyNotes500}, ${closingData.currencyNotes100},
        ${closingData.currencyNotes50}, ${closingData.currencyNotes20},
        ${closingData.currencyNotes10}, '${closingData.calculatedCashTotal}',
        '${closingData.cashDifference}', '${closingData.status}',
        '${closingData.notes.replace(/'/g, "''")}', NOW(), NOW()
      )
      ON CONFLICT (date) DO UPDATE SET
        agent_name = '${closingData.agentName.replace(/'/g, "''")}',
        total_cash_orders = '${closingData.totalCashOrders}',
        total_card_orders = '${closingData.totalCardOrders}',
        total_jazzcash_orders = '${closingData.totalJazzcashOrders}',
        total_easypaisa_orders = '${closingData.totalEasypaisaOrders}',
        total_credit_orders = '${closingData.totalCreditOrders}',
        status = '${closingData.status}',
        notes = '${closingData.notes.replace(/'/g, "''")}',
        updated_at = NOW()
      RETURNING *
    `)

    // Log the completion
    await db.execute(`
      INSERT INTO pos_daily_closing_logs (closing_id, action, details, performed_by, created_at)
      VALUES (${result[0].id}, 'completed', 'Daily closing completed for ${date}', '${agentName || 'Unknown'}', NOW())
    `)

    return NextResponse.json({
      success: true,
      message: `Daily closing completed for ${date}`,
      closingData: result[0],
      totals
    })

  } catch (error) {
    console.error('Error completing daily closing:', error)
    return NextResponse.json(
      { error: 'Failed to complete daily closing' },
      { status: 500 }
    )
  }
}
