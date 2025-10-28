import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get business day status for the specified date using raw SQL
    const businessDay = await db.execute(`
      SELECT * FROM pos_business_day 
      WHERE date = '${date}' 
      LIMIT 1
    `)

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
      // Check if already open using raw SQL
      const existing = await db.execute(`
        SELECT * FROM pos_business_day 
        WHERE date = '${today}' AND status = 'open'
        LIMIT 1
      `)

      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Business day is already open' },
          { status: 400 }
        )
      }

      // Open business day using raw SQL - simplified approach
      let result
      try {
        // Try to insert first
        result = await db.execute(`
          INSERT INTO pos_business_day (date, status, "openedAt", "openedBy", notes, "createdAt", "updatedAt")
          VALUES ('${today}', 'open', NOW(), '${openedBy || 'Unknown'}', ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}, NOW(), NOW())
          RETURNING *
        `)
      } catch (insertError) {
        // If insert fails (likely due to duplicate), try update
        result = await db.execute(`
          UPDATE pos_business_day 
          SET status = 'open',
              "openedAt" = NOW(),
              "openedBy" = '${openedBy || 'Unknown'}',
              notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
              "updatedAt" = NOW()
          WHERE date = '${today}'
          RETURNING *
        `)
      }

      return NextResponse.json({
        success: true,
        message: 'Business day opened successfully',
        businessDay: result[0]
      })

    } else if (action === 'close') {
      // Close business day using raw SQL
      const result = await db.execute(`
        UPDATE pos_business_day 
        SET status = 'closed',
            "closedAt" = NOW(),
            "closedBy" = '${closedBy || 'Unknown'}',
            notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
            "updatedAt" = NOW()
        WHERE date = '${today}' AND status = 'open'
        RETURNING *
      `)

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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action,
      today,
      openedBy,
      closedBy
    })
    return NextResponse.json(
      { 
        error: 'Failed to manage business day',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
