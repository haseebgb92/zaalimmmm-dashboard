import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { personalExpenses } from '@/lib/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = db
      .select({
        head: personalExpenses.head,
        total: sql<number>`SUM(CAST(${personalExpenses.amount} AS DECIMAL))`,
        entries: sql<number>`COUNT(*)`,
      })
      .from(personalExpenses);

    const conditions = [];
    if (startDate) conditions.push(gte(personalExpenses.date, startDate));
    if (endDate) conditions.push(lte(personalExpenses.date, endDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const data = await query
      .groupBy(personalExpenses.head)
      .orderBy(personalExpenses.head);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching personal expense totals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personal expense totals' },
      { status: 500 }
    );
  }
}
