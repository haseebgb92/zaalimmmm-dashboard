import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Read the migration files
    const migrationDir = path.join(process.cwd(), 'drizzle');
    const migrationFiles = [
      '0004_add_pos_tables.sql',
      '0005_add_pos_sample_data.sql',
      '0006_update_pos_menu_to_actual.sql'
    ];
    
    const results = [];
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationDir, file);
      
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            await db.execute(statement.trim());
          }
        }
        
        results.push(`✅ Executed ${file}`);
      } else {
        results.push(`❌ File not found: ${file}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Migrations completed',
      results
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
