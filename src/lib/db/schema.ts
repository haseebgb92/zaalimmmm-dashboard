import { pgTable, text, integer, numeric, timestamp, date, index, boolean, serial } from 'drizzle-orm/pg-core';
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

// POS System Tables
export const posProducts = pgTable('pos_products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const posCustomers = pgTable('pos_customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phoneNumber: text('phone_number'),
  email: text('email'),
  address: text('address'),
  loyaltyPoints: integer('loyalty_points').default(0).notNull(),
  totalSpent: numeric('total_spent', { precision: 10, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const posRiders = pgTable('pos_riders', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phoneNumber: text('phone_number'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const posOrders = pgTable('pos_orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').unique().notNull(),
  customerId: integer('customer_id'),
  riderId: integer('rider_id'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  finalAmount: numeric('final_amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(),
  orderType: text('order_type').default('dine-in').notNull(),
  paymentMethod: text('payment_method'),
  transactionId: text('transaction_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const posOrderItems = pgTable('pos_order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull(),
  productId: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subTotal: numeric('sub_total', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posDailySales = pgTable('pos_daily_sales', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  totalOrders: integer('total_orders').default(0).notNull(),
  totalRevenue: numeric('total_revenue', { precision: 10, scale: 2 }).default('0').notNull(),
  totalDiscounts: numeric('total_discounts', { precision: 10, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  dateIdx: index('pos_daily_sales_date_idx').on(table.date),
}));

export const posHourlySales = pgTable('pos_hourly_sales', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  hour: integer('hour').notNull(),
  totalOrders: integer('total_orders').default(0).notNull(),
  totalRevenue: numeric('total_revenue', { precision: 10, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  dateHourIdx: index('pos_hourly_sales_date_hour_idx').on(table.date, table.hour),
}));

export const posCoupons = pgTable('pos_coupons', {
  id: serial('id').primaryKey(),
  code: text('code').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }),
  maxDiscount: numeric('max_discount', { precision: 10, scale: 2 }),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  validFrom: timestamp('valid_from').notNull(),
  validUntil: timestamp('valid_until').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const posLoyaltyTransactions = pgTable('pos_loyalty_transactions', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull(),
  orderId: integer('order_id'),
  points: integer('points').notNull(),
  type: text('type').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posAdminUsers = pgTable('pos_admin_users', {
  id: serial('id').primaryKey(),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type Sales = typeof sales.$inferSelect;
export type NewSales = typeof sales.$inferInsert;
export type Expenses = typeof expenses.$inferSelect;
export type NewExpenses = typeof expenses.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
export type PersonalExpenses = typeof personalExpenses.$inferSelect;
export type NewPersonalExpenses = typeof personalExpenses.$inferInsert;

// POS Types
export type PosProduct = typeof posProducts.$inferSelect;
export type NewPosProduct = typeof posProducts.$inferInsert;
export type PosCustomer = typeof posCustomers.$inferSelect;
export type NewPosCustomer = typeof posCustomers.$inferInsert;
export type PosRider = typeof posRiders.$inferSelect;
export type NewPosRider = typeof posRiders.$inferInsert;
export type PosOrder = typeof posOrders.$inferSelect;
export type NewPosOrder = typeof posOrders.$inferInsert;
export type PosOrderItem = typeof posOrderItems.$inferSelect;
export type NewPosOrderItem = typeof posOrderItems.$inferInsert;
export type PosDailySales = typeof posDailySales.$inferSelect;
export type NewPosDailySales = typeof posDailySales.$inferInsert;
export type PosHourlySales = typeof posHourlySales.$inferSelect;
export type NewPosHourlySales = typeof posHourlySales.$inferInsert;
export type PosCoupon = typeof posCoupons.$inferSelect;
export type NewPosCoupon = typeof posCoupons.$inferInsert;
export type PosLoyaltyTransaction = typeof posLoyaltyTransactions.$inferSelect;
export type NewPosLoyaltyTransaction = typeof posLoyaltyTransactions.$inferInsert;
export type PosAdminUser = typeof posAdminUsers.$inferSelect;
export type NewPosAdminUser = typeof posAdminUsers.$inferInsert;
