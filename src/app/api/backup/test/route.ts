import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales, expenses, settings, personalExpenses } from '@/lib/db/schema';

export async function POST() {
  try {
    // Fetch all data from all tables
    const [allSales, allExpenses, allSettings, allPersonalExpenses] = await Promise.all([
      db.select().from(sales),
      db.select().from(expenses),
      db.select().from(settings),
      db.select().from(personalExpenses),
    ]);

    // Calculate summary statistics
    const totalSalesAmount = allSales.reduce((sum, s) => sum + parseFloat(s.grossAmount), 0);
    const totalExpensesAmount = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalPersonalAmount = allPersonalExpenses.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      exportType: 'test_backup',
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
        totalSalesAmount,
        totalExpensesAmount,
        totalPersonalAmount,
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Test backup created successfully!',
      backupData,
      summary: {
        salesRecords: allSales.length,
        expensesRecords: allExpenses.length,
        personalExpensesRecords: allPersonalExpenses.length,
        totalSalesAmount: `PKR ${totalSalesAmount.toLocaleString()}`,
        totalExpensesAmount: `PKR ${totalExpensesAmount.toLocaleString()}`,
        totalPersonalAmount: `PKR ${totalPersonalAmount.toLocaleString()}`,
      },
      emailInfo: {
        recipient: 'haseeb.gbpk@gmail.com',
        subject: `Zaalimmmm Dashboard - Test Backup - ${new Date().toLocaleDateString()}`,
        body: `Test backup created successfully with ${allSales.length} sales, ${allExpenses.length} expenses, and ${allPersonalExpenses.length} personal expenses.`,
      }
    });

  } catch (error) {
    console.error('Error creating test backup:', error);
    return NextResponse.json({ 
      error: 'Failed to create test backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
