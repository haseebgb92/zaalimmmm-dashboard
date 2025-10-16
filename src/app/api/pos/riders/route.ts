import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posRiders } from '@/lib/db/schema';

export async function GET() {
  try {
    // Use raw SQL with correct column names from your database
    const riders = await db.execute(`
      SELECT 
        id,
        name,
        "phoneNumber",
        "isActive",
        "createdAt",
        "updatedAt"
      FROM pos_riders 
      WHERE "isActive" = true
    `);
    
    return NextResponse.json(riders);
  } catch (error) {
    console.error('Error fetching riders:', error);
    
    // Return empty array if table doesn't exist yet
    if (error instanceof Error && (error.message.includes('does not exist') || error.message.includes('relation') && error.message.includes('does not exist'))) {
      console.log('POS riders table does not exist, returning empty array');
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch riders',
        details: error instanceof Error ? error.message : 'Unknown error',
        needsMigration: true
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phoneNumber, isActive = true } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const newRider = await db.insert(posRiders).values({
      name,
      phoneNumber,
      isActive,
    }).returning();

    return NextResponse.json(newRider[0]);
  } catch (error) {
    console.error('Error creating rider:', error);
    return NextResponse.json(
      { error: 'Failed to create rider' },
      { status: 500 }
    );
  }
}
