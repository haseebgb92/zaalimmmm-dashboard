import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales, expenses, settings, personalExpenses } from '@/lib/db/schema';

export async function GET() {
  try {
    // Fetch all data from all tables
    const [allSales, allExpenses, allSettings, allPersonalExpenses] = await Promise.all([
      db.select().from(sales),
      db.select().from(expenses),
      db.select().from(settings),
      db.select().from(personalExpenses),
    ]);

    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      exportType: 'full_backup',
      data: {
        sales: allSales,
        expenses: allExpenses,
        settings: allSettings,
        personalExpenses: allPersonalExpenses,
      },
      metadata: {
        totalSales: allSales.length,
        totalExpenses: allExpenses.length,
        totalPersonalExpenses: allPersonalExpenses.length,
      }
    };

    const filename = `zaalimmmm-backup-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}

