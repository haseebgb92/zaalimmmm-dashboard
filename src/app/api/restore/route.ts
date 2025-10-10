import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales, expenses, settings, personalExpenses } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const backupData = await request.json();

    // Validate backup structure
    if (!backupData.version || !backupData.data) {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 });
    }

    const results = {
      sales: { success: 0, errors: 0 },
      expenses: { success: 0, errors: 0 },
      settings: { success: 0, errors: 0 },
      personalExpenses: { success: 0, errors: 0 },
    };

    // Clear existing data (optional - you might want to make this configurable)
    // await db.delete(sales);
    // await db.delete(expenses);
    // await db.delete(personalExpenses);

    // Restore sales
    if (backupData.data.sales && Array.isArray(backupData.data.sales)) {
      for (const sale of backupData.data.sales) {
        try {
          // Check if record already exists
          const existing = await db.select().from(sales).where(sql`${sales.id} = ${sale.id}`);
          
          if (existing.length === 0) {
            await db.insert(sales).values({
              id: sale.id,
              date: sale.date,
              source: sale.source,
              orders: sale.orders,
              grossAmount: sale.grossAmount,
              notes: sale.notes,
              createdAt: sale.createdAt ? new Date(sale.createdAt) : new Date(),
            });
            results.sales.success++;
          }
        } catch (error) {
          console.error('Error restoring sale:', error);
          results.sales.errors++;
        }
      }
    }

    // Restore expenses
    if (backupData.data.expenses && Array.isArray(backupData.data.expenses)) {
      for (const expense of backupData.data.expenses) {
        try {
          const existing = await db.select().from(expenses).where(sql`${expenses.id} = ${expense.id}`);
          
          if (existing.length === 0) {
            await db.insert(expenses).values({
              id: expense.id,
              date: expense.date,
              item: expense.item,
              qty: expense.qty,
              unit: expense.unit,
              amount: expense.amount,
              notes: expense.notes,
              createdAt: expense.createdAt ? new Date(expense.createdAt) : new Date(),
            });
            results.expenses.success++;
          }
        } catch (error) {
          console.error('Error restoring expense:', error);
          results.expenses.errors++;
        }
      }
    }

    // Restore personal expenses
    if (backupData.data.personalExpenses && Array.isArray(backupData.data.personalExpenses)) {
      for (const pExpense of backupData.data.personalExpenses) {
        try {
          const existing = await db.select().from(personalExpenses).where(sql`${personalExpenses.id} = ${pExpense.id}`);
          
          if (existing.length === 0) {
            await db.insert(personalExpenses).values({
              id: pExpense.id,
              date: pExpense.date,
              head: pExpense.head,
              amount: pExpense.amount,
              notes: pExpense.notes,
              createdAt: pExpense.createdAt ? new Date(pExpense.createdAt) : new Date(),
            });
            results.personalExpenses.success++;
          }
        } catch (error) {
          console.error('Error restoring personal expense:', error);
          results.personalExpenses.errors++;
        }
      }
    }

    // Restore settings
    if (backupData.data.settings && Array.isArray(backupData.data.settings)) {
      for (const setting of backupData.data.settings) {
        try {
          // Update or insert settings
          const existing = await db.select().from(settings).where(sql`${settings.key} = ${setting.key}`);
          
          if (existing.length > 0) {
            await db.update(settings)
              .set({ value: setting.value })
              .where(sql`${settings.key} = ${setting.key}`);
          } else {
            await db.insert(settings).values({
              key: setting.key,
              value: setting.value,
            });
          }
          results.settings.success++;
        } catch (error) {
          console.error('Error restoring setting:', error);
          results.settings.errors++;
        }
      }
    }

    const totalSuccess = results.sales.success + results.expenses.success + 
                         results.personalExpenses.success + results.settings.success;
    const totalErrors = results.sales.errors + results.expenses.errors + 
                        results.personalExpenses.errors + results.settings.errors;

    return NextResponse.json({
      message: `Restore completed. ${totalSuccess} records restored successfully.`,
      results,
      summary: {
        totalSuccess,
        totalErrors,
      }
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ 
      error: 'Failed to restore backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

