import { pgTable, text, integer, numeric, timestamp, date, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const sales = pgTable('sales', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  date: date('date').notNull(),
  source: text('source', { enum: ['spot', 'foodpanda'] }).notNull(),
  orders: integer('orders').notNull().default(0),
  grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  dateSourceIdx: index('sales_date_source_idx').on(table.date, table.source),
}));

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  date: date('date').notNull(),
  item: text('item').notNull(),
  qty: numeric('qty', { precision: 12, scale: 3 }),
  unit: text('unit'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  dateIdx: index('expenses_date_idx').on(table.date),
  itemIdx: index('expenses_item_idx').on(table.item),
}));

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const personalExpenses = pgTable('personal_expenses', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  date: date('date').notNull(),
  head: text('head').notNull(), // Person name (Shahbaz, Hasnain, etc.)
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(), // Can be positive (credit) or negative (debit)
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  dateIdx: index('personal_expenses_date_idx').on(table.date),
  headIdx: index('personal_expenses_head_idx').on(table.head),
}));

export type Sales = typeof sales.$inferSelect;
export type NewSales = typeof sales.$inferInsert;
export type Expenses = typeof expenses.$inferSelect;
export type NewExpenses = typeof expenses.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
export type PersonalExpenses = typeof personalExpenses.$inferSelect;
export type NewPersonalExpenses = typeof personalExpenses.$inferInsert;
