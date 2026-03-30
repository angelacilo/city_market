-- Markets
insert into markets (name, barangay, address, description, image_url) values
('Divisoria Market', 'Brgy. Divisoria', 'Divisoria, Butuan City', 'A central hub for fresh local products in Divisoria.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'),
('Pili Market', 'Brgy. Pili', 'Pili, Butuan City', 'Famous for its affordable seafood and fresh catch from the nearby coasts.', 'https://images.unsplash.com/photo-1543083477-4f7fe1921694?auto=format&fit=crop&q=80&w=800'),
('Cogon Market', 'Brgy. Cogon', 'Cogon, Butuan City', 'The go-to market for vegetables and meat in the heart of Cogon.', 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=800'),
('Robinsons Wet Market', 'Robinsons Place Butuan', 'JC Aquino Ave, Butuan City', 'Clean, air-conditioned alternative for your fresh market needs inside the mall.', 'https://images.unsplash.com/photo-1506484334402-40f21557d66a?auto=format&fit=crop&q=80&w=800'),
('Libertad Public Market', 'Brgy. Libertad', 'Libertad, Butuan City', 'One of the largest public markets with a wide variety of goods and supplies.', 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=800'),
('Agora Market', 'Brgy. Agora', 'Agora, Butuan City', 'Bustling market known for wholesale prices and diverse product selections.', 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&q=80&w=800');

-- Product categories
insert into categories (name, icon) values
('Vegetables', 'leaf'),
('Fruits', 'apple'),
('Meat', 'meat'),
('Seafood', 'fish'),
('Dry Goods', 'package'),
('Rice & Grains', 'wheat'),
('Condiments', 'bottle');

-- Shared product catalog
insert into products (category_id, name, unit, description) values
((select id from categories where name = 'Rice & Grains'), 'Rice', 'kg', 'Local high quality rice.'),
((select id from categories where name = 'Meat'), 'Pork', 'kg', 'Fresh local pork.'),
((select id from categories where name = 'Meat'), 'Chicken', 'kg', 'Fresh spring chicken.'),
((select id from categories where name = 'Seafood'), 'Bangus', 'kg', 'Fresh milk fish.'),
((select id from categories where name = 'Seafood'), 'Tilapia', 'kg', 'Fresh river tilapia.'),
((select id from categories where name = 'Vegetables'), 'Tomato', 'kg', 'Red ripe tomatoes.'),
((select id from categories where name = 'Vegetables'), 'Onion', 'kg', 'White/Red onions.'),
((select id from categories where name = 'Vegetables'), 'Garlic', 'kg', 'Local garlic.'),
((select id from categories where name = 'Dry Goods'), 'Eggs', 'piece', 'Fresh table eggs.'),
((select id from categories where name = 'Condiments'), 'Cooking Oil', 'liter', 'Refined vegetable oil.'),
((select id from categories where name = 'Vegetables'), 'Cabbage', 'kg', 'Fresh green cabbage.');
