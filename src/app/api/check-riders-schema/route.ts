import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check the actual schema of pos_riders table
    const schemaInfo = await db.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pos_riders' 
      ORDER BY ordinal_position
    `);
    
    // Get sample data to see the actual structure
    const sampleData = await db.execute('SELECT * FROM pos_riders LIMIT 1');
    
    return NextResponse.json({
      success: true,
      schema: schemaInfo,
      sampleData: sampleData[0] || null
    });
  } catch (error) {
    console.error('Riders schema check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
