import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get unique customers by phone number, combining data and calculating total spent
    const customers = await db.execute(`
      SELECT 
        MIN(id) as id,
        name,
        "phoneNumber",
        email,
        address,
        SUM("totalSpent") as "totalSpent",
        SUM("loyaltyPoints") as "loyaltyPoints",
        MIN("createdAt") as "createdAt",
        MAX("updatedAt") as "updatedAt"
      FROM pos_customers 
      WHERE "phoneNumber" IS NOT NULL AND "phoneNumber" != ''
      GROUP BY "phoneNumber", name, email, address
      
      UNION ALL
      
      SELECT 
        id,
        name,
        "phoneNumber",
        email,
        address,
        "totalSpent",
        "loyaltyPoints",
        "createdAt",
        "updatedAt"
      FROM pos_customers 
      WHERE "phoneNumber" IS NULL OR "phoneNumber" = ''
      
      ORDER BY name
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

    // Create customer using raw SQL
    const newCustomer = await db.execute(`
      INSERT INTO pos_customers (
        name, "phoneNumber", email, address, "loyaltyPoints", "totalSpent", "createdAt", "updatedAt"
      ) VALUES (
        '${name}', 
        ${phoneNumber ? `'${phoneNumber}'` : 'NULL'}, 
        ${email ? `'${email}'` : 'NULL'}, 
        ${address ? `'${address}'` : 'NULL'}, 
        0, 
        '0', 
        NOW(), 
        NOW()
      ) RETURNING *
    `);

    return NextResponse.json(newCustomer[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
