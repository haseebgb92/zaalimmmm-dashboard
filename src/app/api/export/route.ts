import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales, expenses } from '@/lib/db/schema';
import { and, gte, lte } from 'drizzle-orm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const format = searchParams.get('format') || 'csv';

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    // Convert dates to Asia/Karachi timezone
    const start = dayjs.tz(startDate, 'Asia/Karachi').startOf('day').utc().format('YYYY-MM-DD');
    const end = dayjs.tz(endDate, 'Asia/Karachi').endOf('day').utc().format('YYYY-MM-DD');

    // Fetch data
    const salesData = await db
      .select()
      .from(sales)
      .where(and(gte(sales.date, start), lte(sales.date, end)))
      .orderBy(sales.date, sales.createdAt);

    const expensesData = await db
      .select()
      .from(expenses)
      .where(and(gte(expenses.date, start), lte(expenses.date, end)))
      .orderBy(expenses.date, expenses.createdAt);

    if (format === 'json') {
      const exportData = {
        exportDate: new Date().toISOString(),
        dateRange: { start, end },
        sales: salesData,
        expenses: expensesData,
      };

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="zaalimmmm-export-${start}-${end}.json"`,
        },
      });
    }

    // CSV format
    let csvContent = '';

    // Sales CSV
    csvContent += 'SALES DATA\n';
    csvContent += 'date,source,orders,gross_amount,notes\n';
    salesData.forEach(sale => {
      csvContent += `${sale.date},${sale.source},${sale.orders},${sale.grossAmount},"${sale.notes || ''}"\n`;
    });

    csvContent += '\nEXPENSES DATA\n';
    csvContent += 'date,item,qty,unit,amount,notes\n';
    expensesData.forEach(expense => {
      csvContent += `${expense.date},"${expense.item}",${expense.qty || ''},${expense.unit || ''},${expense.amount},"${expense.notes || ''}"\n`;
    });

    // Data Dictionary
    csvContent += '\nDATA DICTIONARY\n';
    csvContent += 'Field,Description,Type,Example\n';
    csvContent += 'date,Date of transaction,YYYY-MM-DD,2025-01-01\n';
    csvContent += 'source,Sales source,spot|foodpanda,spot\n';
    csvContent += 'orders,Number of orders,integer,45\n';
    csvContent += 'gross_amount,Gross sales amount,decimal,125000.00\n';
    csvContent += 'notes,Additional notes,text,Evening rush\n';
    csvContent += 'item,Expense item,text,Chicken\n';
    csvContent += 'qty,Quantity,decimal,25.000\n';
    csvContent += 'unit,Unit of measurement,text,kg\n';
    csvContent += 'amount,Total amount,decimal,15500.00\n';

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="zaalimmmm-export-${start}-${end}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
