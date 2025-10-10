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

    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      exportType: 'automatic_backup',
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

    // Calculate summary statistics
    const totalSalesAmount = allSales.reduce((sum, s) => sum + parseFloat(s.grossAmount), 0);
    const totalExpensesAmount = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalPersonalAmount = allPersonalExpenses.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Create email content
    const emailSubject = `Zaalimmmm Dashboard - Automatic Backup - ${new Date().toLocaleDateString()}`;
    
    const emailText = `
Zaalimmmm Shawarma Dashboard - Automatic Backup

Backup Date: ${new Date().toLocaleString()}
Backup Type: Automatic (Every 3 days)

📊 DATA SUMMARY:
- Sales Records: ${allSales.length} entries
- Expenses Records: ${allExpenses.length} entries  
- Personal Expenses: ${allPersonalExpenses.length} entries
- Total Sales Amount: PKR ${totalSalesAmount.toLocaleString()}
- Total Expenses Amount: PKR ${totalExpensesAmount.toLocaleString()}
- Total Personal Amount: PKR ${totalPersonalAmount.toLocaleString()}

📎 ATTACHMENT:
The complete backup file is attached as JSON.

🔄 RESTORE INSTRUCTIONS:
1. Go to Settings → Data Management
2. Click "Choose File" under Restore Data
3. Select the attached backup file
4. Click "Restore"

This backup was created automatically every 3 days to ensure your data is always safe.

Best regards,
Zaalimmmm Dashboard System
    `.trim();

    // For now, we'll return the backup data and email content
    // In a real implementation, you'd use an email service like:
    // - Resend, SendGrid, Nodemailer, etc.
    
    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      emailSubject,
      emailText,
      backupData,
      recipient: 'haseeb.gbpk@gmail.com',
      nextBackup: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    });

  } catch (error) {
    console.error('Error creating email backup:', error);
    return NextResponse.json({ 
      error: 'Failed to create email backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
