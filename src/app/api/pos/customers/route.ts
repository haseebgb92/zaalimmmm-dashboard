import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posCustomers } from '@/lib/db/schema';

export async function GET() {
  try {
    // Use raw SQL to avoid Drizzle ORM schema issues
    const customers = await db.execute(`
      SELECT 
        id,
        name,
        "phoneNumber",
        email,
        address,
        "loyaltyPoints",
        "totalSpent",
        "createdAt",
        "updatedAt"
      FROM pos_customers
    `);
    
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phoneNumber, email, address } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const newCustomer = await db.insert(posCustomers).values({
      name,
      phoneNumber,
      email,
      address,
    }).returning();

    return NextResponse.json(newCustomer[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
