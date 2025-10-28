import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test if the business day table exists and is accessible
    const testQuery = await db.execute(`
      SELECT COUNT(*) as count FROM pos_business_day
    `)
    
    return NextResponse.json({
      success: true,
      message: 'Business day table is accessible',
      count: testQuery[0]?.count || 0
    })
  } catch (error) {
    console.error('Error testing business day table:', error)
    return NextResponse.json(
      { 
        error: 'Business day table test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
