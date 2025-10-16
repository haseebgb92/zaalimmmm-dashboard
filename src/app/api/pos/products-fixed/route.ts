import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Use raw SQL with the correct column names from your database
    const products = await db.execute(`
      SELECT 
        id,
        name,
        price,
        category,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM pos_products 
      WHERE is_active = true 
      ORDER BY category
    `);
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products (fixed):', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
