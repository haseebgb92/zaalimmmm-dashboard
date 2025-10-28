import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { posBusinessDay } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get business day status for the specified date
    const businessDay = await db
      .select()
      .from(posBusinessDay)
      .where(eq(posBusinessDay.date, date))
      .limit(1)

    if (businessDay.length > 0) {
      return NextResponse.json(businessDay[0])
    }

    // Return default status if no record exists
    return NextResponse.json({
      date,
      status: 'closed',
      openedAt: null,
      closedAt: null,
      openedBy: null,
      closedBy: null,
      notes: null
    })

  } catch (error) {
    console.error('Error fetching business day status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business day status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, openedBy, closedBy, notes } = body // action: 'open' or 'close'
    
    const today = new Date().toISOString().split('T')[0]
    
    if (action === 'open') {
      // Check if already open
      const existing = await db
        .select()
        .from(posBusinessDay)
        .where(eq(posBusinessDay.date, today))
        .limit(1)

      if (existing.length > 0 && existing[0].status === 'open') {
        return NextResponse.json(
          { error: 'Business day is already open' },
          { status: 400 }
        )
      }

      // Open business day
      const result = await db
        .insert(posBusinessDay)
        .values({
          date: today,
          status: 'open',
          openedAt: new Date(),
          openedBy: openedBy || 'Unknown',
          notes
        })
        .onConflictDoUpdate({
          target: posBusinessDay.date,
          set: {
            status: 'open',
            openedAt: new Date(),
            openedBy: openedBy || 'Unknown',
            notes,
            updatedAt: new Date()
          }
        })
        .returning()

      return NextResponse.json({
        success: true,
        message: 'Business day opened successfully',
        businessDay: result[0]
      })

    } else if (action === 'close') {
      // Close business day
      const result = await db
        .update(posBusinessDay)
        .set({
          status: 'closed',
          closedAt: new Date(),
          closedBy: closedBy || 'Unknown',
          notes,
          updatedAt: new Date()
        })
        .where(eq(posBusinessDay.date, today))
        .returning()

      if (result.length === 0) {
        return NextResponse.json(
          { error: 'No open business day found to close' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Business day closed successfully',
        businessDay: result[0]
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "open" or "close"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error managing business day:', error)
    return NextResponse.json(
      { error: 'Failed to manage business day' },
      { status: 500 }
    )
  }
}
