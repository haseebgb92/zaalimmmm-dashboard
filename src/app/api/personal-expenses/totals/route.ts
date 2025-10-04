import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { personalExpenses } from '@/lib/db/schema';
import { and, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereConditions = [];
    if (startDate) whereConditions.push(gte(personalExpenses.date, startDate));
    if (endDate) whereConditions.push(lte(personalExpenses.date, endDate));

    const data = await db
      .select({
        head: personalExpenses.head,
        total: sql<number>`SUM(CAST(${personalExpenses.amount} AS DECIMAL))`,
        entries: sql<number>`COUNT(*)`,
      })
      .from(personalExpenses)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
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
