import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posProducts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const products = await db.select().from(posProducts).where(eq(posProducts.isActive, true)).orderBy(posProducts.category);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    // Return empty array if table doesn't exist yet
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json([]);
    }
    return NextResponse.json(
      { error: 'Failed to fetch products' },
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