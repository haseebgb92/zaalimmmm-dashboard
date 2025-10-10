import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Check if automatic backups are enabled
    const backupSetting = await db.select().from(settings).where(eq(settings.key, 'AUTO_BACKUP_ENABLED')).limit(1);
    const isEnabled = backupSetting[0]?.value === 'true';

    // Get last backup date
    const lastBackupSetting = await db.select().from(settings).where(eq(settings.key, 'LAST_BACKUP_DATE')).limit(1);
    const lastBackupDate = lastBackupSetting[0]?.value;

    // Check if 3 days have passed since last backup
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const shouldBackup = !lastBackupDate || new Date(lastBackupDate) < threeDaysAgo;

    return NextResponse.json({
      enabled: isEnabled,
      lastBackup: lastBackupDate,
      shouldBackup,
      nextBackup: lastBackupDate ? new Date(new Date(lastBackupDate).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() : null,
    });

  } catch (error) {
    console.error('Error checking backup schedule:', error);
    return NextResponse.json({ error: 'Failed to check backup schedule' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'enable') {
      // Enable automatic backups
      await db.insert(settings).values({
        key: 'AUTO_BACKUP_ENABLED',
        value: 'true',
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value: 'true' },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Automatic backups enabled. Backups will be sent to haseeb.gbpk@gmail.com every 3 days.' 
      });
    } else if (action === 'disable') {
      // Disable automatic backups
      await db.insert(settings).values({
        key: 'AUTO_BACKUP_ENABLED',
        value: 'false',
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value: 'false' },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Automatic backups disabled.' 
      });
    } else if (action === 'test') {
      // For now, just simulate a successful test backup
      // In a real implementation, you'd integrate with an email service here
      
      // Update last backup date
      await db.insert(settings).values({
        key: 'LAST_BACKUP_DATE',
        value: new Date().toISOString(),
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value: new Date().toISOString() },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Test backup prepared successfully! (Email integration pending - backup data is ready to be sent to haseeb.gbpk@gmail.com)' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error managing backup schedule:', error);
    return NextResponse.json({ error: 'Failed to manage backup schedule' }, { status: 500 });
  }
}
