import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test basic database connection
    await db.execute('SELECT 1 as test');
    
    // Check if POS tables exist
    const tablesCheck = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'pos_%'
    `);
    
    const existingTables = tablesCheck.map((row: Record<string, unknown>) => row.table_name as string);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      existingTables,
      needsMigration: existingTables.length === 0
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      needsMigration: true
    }, { status: 500 });
  }
}
