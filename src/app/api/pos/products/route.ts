import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posProducts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Use raw SQL to avoid Drizzle ORM schema issues
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
    console.error('Error fetching products:', error);
    
    // Return empty array if table doesn't exist yet
    if (error instanceof Error && (error.message.includes('does not exist') || error.message.includes('relation') && error.message.includes('does not exist'))) {
      console.log('POS products table does not exist, returning empty array');
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
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
    const { name, price, category, isActive = true } = body;

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: 'Name, price, and category are required' },
        { status: 400 }
      );
    }

    const newProduct = await db.insert(posProducts).values({
      name,
      price: price.toString(),
      category,
      isActive,
    }).returning();

    return NextResponse.json(newProduct[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}