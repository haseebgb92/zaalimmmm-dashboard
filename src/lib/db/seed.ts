import { db } from './index';
import { settings } from './schema';

export async function seedDatabase() {
  try {
    // Insert default settings
    await db.insert(settings).values([
      { key: 'FP_PROFIT_RATE', value: '0.70' },
      { key: 'CURRENCY', value: 'PKR' },
    ]).onConflictDoNothing();
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
