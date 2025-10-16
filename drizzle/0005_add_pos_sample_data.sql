-- Add sample POS data
-- Products
INSERT INTO pos_products (name, price, category, is_active, created_at, updated_at) VALUES
('Chicken Shawarma', '450.00', 'Shawarma', true, NOW(), NOW()),
('Beef Shawarma', '500.00', 'Shawarma', true, NOW(), NOW()),
('Mixed Shawarma', '550.00', 'Shawarma', true, NOW(), NOW()),
('Chicken Tikka Shawarma', '480.00', 'Shawarma', true, NOW(), NOW()),
('Lamb Shawarma', '600.00', 'Shawarma', true, NOW(), NOW()),
('Chicken Wrap', '350.00', 'Wraps', true, NOW(), NOW()),
('Beef Wrap', '400.00', 'Wraps', true, NOW(), NOW()),
('Mixed Wrap', '450.00', 'Wraps', true, NOW(), NOW()),
('Chicken Burger', '380.00', 'Burgers', true, NOW(), NOW()),
('Beef Burger', '420.00', 'Burgers', true, NOW(), NOW()),
('Chicken Sandwich', '320.00', 'Sandwiches', true, NOW(), NOW()),
('Beef Sandwich', '360.00', 'Sandwiches', true, NOW(), NOW()),
('French Fries', '150.00', 'Sides', true, NOW(), NOW()),
('Onion Rings', '180.00', 'Sides', true, NOW(), NOW()),
('Chicken Nuggets', '250.00', 'Sides', true, NOW(), NOW()),
('Cola', '80.00', 'Beverages', true, NOW(), NOW()),
('Sprite', '80.00', 'Beverages', true, NOW(), NOW()),
('Fanta', '80.00', 'Beverages', true, NOW(), NOW()),
('Water', '50.00', 'Beverages', true, NOW(), NOW()),
('Tea', '60.00', 'Beverages', true, NOW(), NOW()),
('Coffee', '80.00', 'Beverages', true, NOW(), NOW());

-- Riders
INSERT INTO pos_riders (name, phone_number, is_active, created_at, updated_at) VALUES
('Ahmed Ali', '+92-300-1234567', true, NOW(), NOW()),
('Muhammad Hassan', '+92-301-2345678', true, NOW(), NOW()),
('Ali Raza', '+92-302-3456789', true, NOW(), NOW()),
('Usman Khan', '+92-303-4567890', true, NOW(), NOW()),
('Bilal Ahmed', '+92-304-5678901', true, NOW(), NOW()),
('Saad Malik', '+92-305-6789012', true, NOW(), NOW()),
('Zain Ali', '+92-306-7890123', true, NOW(), NOW()),
('Hamza Khan', '+92-307-8901234', true, NOW(), NOW());

-- Sample Customers
INSERT INTO pos_customers (name, phone_number, email, address, loyalty_points, total_spent, created_at, updated_at) VALUES
('Haseeb Ahmed', '+92-300-1111111', 'haseeb@example.com', 'Gulberg, Lahore', 150, '2500.00', NOW(), NOW()),
('Hassan Mohsin', '+92-300-2222222', 'hassan@example.com', 'DHA, Lahore', 200, '3200.00', NOW(), NOW()),
('Ali Raza', '+92-300-3333333', 'ali@example.com', 'Johar Town, Lahore', 75, '1800.00', NOW(), NOW()),
('Usman Khan', '+92-300-4444444', 'usman@example.com', 'Model Town, Lahore', 100, '2100.00', NOW(), NOW()),
('Bilal Ahmed', '+92-300-5555555', 'bilal@example.com', 'Faisalabad', 50, '1200.00', NOW(), NOW()),
('Saad Malik', '+92-300-6666666', 'saad@example.com', 'Karachi', 125, '2800.00', NOW(), NOW()),
('Zain Ali', '+92-300-7777777', 'zain@example.com', 'Islamabad', 80, '1900.00', NOW(), NOW()),
('Hamza Khan', '+92-300-8888888', 'hamza@example.com', 'Rawalpindi', 90, '2000.00', NOW(), NOW()),
('Ahmad Hassan', '+92-300-9999999', 'ahmad@example.com', 'Multan', 60, '1400.00', NOW(), NOW()),
('Muhammad Ali', '+92-300-0000000', 'muhammad@example.com', 'Peshawar', 110, '2300.00', NOW(), NOW());

-- Sample Orders (last 7 days)
INSERT INTO pos_orders (order_number, customer_id, rider_id, total_amount, discount_amount, final_amount, status, order_type, payment_method, transaction_id, notes, created_at, updated_at) VALUES
('ORD-1703123456789-ABCD', 1, 1, '900.00', '0.00', '900.00', 'completed', 'delivery', 'cash', NULL, 'Extra spicy', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('ORD-1703123456790-EFGH', 2, 2, '1200.00', '50.00', '1150.00', 'completed', 'takeaway', 'card', 'TXN123456', 'No onions', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('ORD-1703123456791-IJKL', 3, 3, '750.00', '0.00', '750.00', 'completed', 'dine-in', 'cash', NULL, NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('ORD-1703123456792-MNOP', 4, 4, '1100.00', '100.00', '1000.00', 'completed', 'delivery', 'jazzcash', 'JC789012', 'Extra sauce', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('ORD-1703123456793-QRST', 5, 5, '600.00', '0.00', '600.00', 'completed', 'takeaway', 'easypaisa', 'EP345678', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('ORD-1703123456794-UVWX', 6, 6, '850.00', '25.00', '825.00', 'completed', 'delivery', 'cash', NULL, 'Less spicy', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('ORD-1703123456795-YZAB', 7, 7, '950.00', '0.00', '950.00', 'completed', 'dine-in', 'card', 'TXN789012', NULL, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('ORD-1703123456796-CDEF', 8, 8, '700.00', '50.00', '650.00', 'completed', 'takeaway', 'cash', NULL, 'Extra cheese', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('ORD-1703123456797-GHIJ', 9, 1, '800.00', '0.00', '800.00', 'completed', 'delivery', 'jazzcash', 'JC456789', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('ORD-1703123456798-KLMN', 10, 2, '1050.00', '75.00', '975.00', 'completed', 'dine-in', 'easypaisa', 'EP901234', 'Extra crispy', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- Sample Order Items
INSERT INTO pos_order_items (order_id, product_id, quantity, unit_price, sub_total, created_at, updated_at) VALUES
-- Order 1: 2x Chicken Shawarma
(1, 1, 2, '450.00', '900.00', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
-- Order 2: 1x Beef Shawarma + 1x Mixed Shawarma + 1x French Fries
(2, 2, 1, '500.00', '500.00', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(2, 3, 1, '550.00', '550.00', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(2, 13, 1, '150.00', '150.00', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
-- Order 3: 1x Chicken Tikka Shawarma + 1x Cola
(3, 4, 1, '480.00', '480.00', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(3, 16, 1, '80.00', '80.00', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
-- Order 4: 2x Lamb Shawarma
(4, 5, 2, '600.00', '1200.00', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
-- Order 5: 1x Chicken Wrap + 1x Beef Wrap
(5, 6, 1, '350.00', '350.00', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(5, 7, 1, '400.00', '400.00', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
-- Order 6: 1x Mixed Wrap + 1x Chicken Nuggets + 1x Sprite
(6, 8, 1, '450.00', '450.00', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(6, 15, 1, '250.00', '250.00', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(6, 17, 1, '80.00', '80.00', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
-- Order 7: 1x Chicken Burger + 1x Beef Burger + 1x French Fries
(7, 9, 1, '380.00', '380.00', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(7, 10, 1, '420.00', '420.00', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(7, 13, 1, '150.00', '150.00', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
-- Order 8: 1x Chicken Sandwich + 1x Beef Sandwich + 1x Tea
(8, 11, 1, '320.00', '320.00', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(8, 12, 1, '360.00', '360.00', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(8, 20, 1, '60.00', '60.00', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
-- Order 9: 1x Mixed Shawarma + 1x Onion Rings + 1x Fanta
(9, 3, 1, '550.00', '550.00', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(9, 14, 1, '180.00', '180.00', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(9, 18, 1, '80.00', '80.00', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
-- Order 10: 1x Beef Shawarma + 1x Chicken Tikka Shawarma + 1x Coffee
(10, 2, 1, '500.00', '500.00', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(10, 4, 1, '480.00', '480.00', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(10, 21, 1, '80.00', '80.00', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- Sample Daily Sales
INSERT INTO pos_daily_sales (date, total_orders, total_revenue, total_discounts, created_at, updated_at) VALUES
(CURRENT_DATE - INTERVAL '1 day', 2, '2050.00', '50.00', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(CURRENT_DATE - INTERVAL '2 days', 2, '1750.00', '100.00', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(CURRENT_DATE - INTERVAL '3 days', 2, '1450.00', '25.00', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(CURRENT_DATE - INTERVAL '4 days', 2, '1600.00', '50.00', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(CURRENT_DATE - INTERVAL '5 days', 2, '1775.00', '75.00', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- Sample Hourly Sales (for today)
INSERT INTO pos_hourly_sales (date, hour, total_orders, total_revenue, created_at, updated_at) VALUES
(CURRENT_DATE, 14, 1, '450.00', NOW(), NOW()),
(CURRENT_DATE, 15, 2, '850.00', NOW(), NOW()),
(CURRENT_DATE, 16, 1, '500.00', NOW(), NOW()),
(CURRENT_DATE, 17, 3, '1200.00', NOW(), NOW()),
(CURRENT_DATE, 18, 2, '900.00', NOW(), NOW()),
(CURRENT_DATE, 19, 4, '1600.00', NOW(), NOW()),
(CURRENT_DATE, 20, 3, '1350.00', NOW(), NOW()),
(CURRENT_DATE, 21, 2, '800.00', NOW(), NOW()),
(CURRENT_DATE, 22, 1, '400.00', NOW(), NOW()),
(CURRENT_DATE, 23, 1, '350.00', NOW(), NOW());
