import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

async function seed() {
  try {
    console.log('Seeding database...');
    
    const connectionString = process.env.POSTGRES_URL!;
    const client = postgres(connectionString);
    
    // Insert default settings
    await client`
      INSERT INTO settings (key, value) 
      VALUES ('FP_PROFIT_RATE', '0.70'), ('CURRENCY', 'PKR')
      ON CONFLICT (key) DO NOTHING
    `;
    
    await client.end();
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seed();
