-- Update POS menu to match actual menu from database
-- First, clear existing sample data
DELETE FROM pos_products;

-- Insert actual menu items from your database
INSERT INTO pos_products (name, price, category, is_active, created_at, updated_at) VALUES
-- Shawarma Category
('Kids Shawarma', '100.00', 'Shawarma', true, NOW(), NOW()),
('Regular Shawarma', '150.00', 'Shawarma', true, NOW(), NOW()),
('Large Shawarma', '200.00', 'Shawarma', true, NOW(), NOW()),
('Regular Cheese Shawarma', '200.00', 'Shawarma', true, NOW(), NOW()),
('Special Cheese Shawarma', '300.00', 'Shawarma', true, NOW(), NOW()),
('Hot Shawarma', '200.00', 'Shawarma', true, NOW(), NOW()),
('Jalapeno Shawarma', '250.00', 'Shawarma', true, NOW(), NOW()),
('Cheese Jalapeno Shawarma', '300.00', 'Shawarma', true, NOW(), NOW()),

-- Burgers Category
('Regular Burger', '150.00', 'Burgers', true, NOW(), NOW()),
('Cheese Burger', '200.00', 'Burgers', true, NOW(), NOW()),

-- Fries Category
('Plain Fries', '300.00', 'Fries', true, NOW(), NOW()),
('Masala Fries', '300.00', 'Fries', true, NOW(), NOW()),
('Mayo Garlic Fries', '350.00', 'Fries', true, NOW(), NOW()),
('BBQ Fries', '350.00', 'Fries', true, NOW(), NOW()),
('Tex Mex Fries', '350.00', 'Fries', true, NOW(), NOW()),

-- Dips Category
('Mayo Garlic Dip', '40.00', 'Dips', true, NOW(), NOW()),
('Tex Mex Dip', '50.00', 'Dips', true, NOW(), NOW()),
('Spicy Peri Peri Dip', '50.00', 'Dips', true, NOW(), NOW()),
('Honey BBQ Dip', '50.00', 'Dips', true, NOW(), NOW()),

-- Wraps Category
('Tex Mex Wrap', '450.00', 'Wraps', true, NOW(), NOW()),
('Spicy Peri Peri Wrap', '450.00', 'Wraps', true, NOW(), NOW()),
('Honey BBQ Wrap', '450.00', 'Wraps', true, NOW(), NOW()),

-- Specials Category
('Special Shawarma', '450.00', 'Specials', true, NOW(), NOW()),
('Special Loaded Fries', '450.00', 'Specials', true, NOW(), NOW());
