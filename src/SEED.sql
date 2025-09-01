-- Seed data for Sanae Hainanese Chicken Rice POS
-- Run this after running SCHEMA.sql

-- Insert menu items
INSERT INTO menu_items (name, name_th, price, category, available, description, modifiers) VALUES 
-- Rice dishes
('Hainanese Chicken Rice', 'ข้าวมันไก่', 45.00, 'rice', true, 'ข้าวมันไก่ต้นตำรับ เสิร์ฟพร้อมไก่นึ่ง', '["ไก่ต้ม", "ไก่ย่าง", "ไก่ทอด", "เพิ่มไข่", "ไม่ใส่ผัก"]'),
('Roasted Chicken Rice', 'ข้าวมันไก่ย่าง', 50.00, 'rice', true, 'ข้าวมันไก่ย่างหอม กรอบนอกนุ่มใน', '["เพิ่มไก่", "เพิ่มไข่", "ไม่ใส่ผัก"]'),
('Mixed Chicken Rice', 'ข้าวมันไก่ผสม', 55.00, 'rice', true, 'ข้าวมันไก่ผสม ทั้งต้มและย่าง', '["เพิ่มไก่", "เพิ่มไข่", "ไม่ใส่ผัก"]'),
('Chicken Porridge', 'โจ๊กไก่', 35.00, 'rice', true, 'โจ๊กไก่นุ่ม รสชาติเข้มข้น', '["เพิ่มไก่", "เพิ่มไข่", "ใส่พริกไทย"]'),

-- Noodle dishes  
('Chicken Noodle Soup', 'ก๋วยเตี๋ยวไก่', 40.00, 'noodles', true, 'ก๋วยเตี๋ยวน้ำใสไก่ รสชาติกลมกล่อม', '["เส้นเล็ก", "เส้นใหญ่", "เส้นหมี่", "ไม่ใส่ผัก"]'),
('Chicken Dry Noodles', 'ก๋วยเตี๋ยวไก่แห้ง', 40.00, 'noodles', true, 'ก๋วยเตี๋ยวแห้งไก่ ราดน้ำซอส', '["เส้นเล็ก", "เส้นใหญ่", "เส้นหมี่", "ไม่ใส่ผัก"]'),

-- Appetizers
('Chicken Satay', 'ไก่สะเต๊ะ', 25.00, 'appetizer', true, 'ไก่สะเต๊ะย่าง 3 ไม้ เสิร์ฟพร้อมซอสถั่ว', '["ไม่เผ็ด", "เผ็ดน้อย", "เผ็ดมาก"]'),
('Chicken Wings', 'ปีกไก่ทอด', 30.00, 'appetizer', true, 'ปีกไก่ทอดกรอบ 4 ชิ้น', '["ไม่เผ็ด", "เผ็ดน้อย", "เผ็ดมาก"]'),
('Spring Rolls', 'ปอเปี๊ยะทอด', 20.00, 'appetizer', true, 'ปอเปี๊ยะทอดกรอบ 4 ชิ้น', '[]'),

-- Desserts
('Mango Sticky Rice', 'ข้าวเหนียวมะม่วง', 45.00, 'dessert', true, 'ข้าวเหนียวมะม่วงสุก หวานหอม', '["เพิ่มมะม่วง", "เพิ่มกะทิ"]'),
('Thai Custard', 'ทับทิมกรอบ', 25.00, 'dessert', true, 'ทับทิมกรอบเนื้อมะพร้าว', '["เพิ่มน้ำแข็ง"]'),

-- Beverages
('Thai Iced Tea', 'ชาเย็น', 20.00, 'tea', true, 'ชาไทยเย็น รสชาติหอมหวาน', '["หวานน้อย", "หวานปกติ", "หวานมาก", "ไม่ใส่นม"]'),
('Thai Hot Tea', 'ชาร้อน', 15.00, 'tea', true, 'ชาไทยร้อน เข้มข้น', '["หวานน้อย", "หวานปกติ", "หวานมาก"]'),
('Iced Coffee', 'กาแฟเย็น', 25.00, 'beverage', true, 'กาแฟเย็นปั่น เข้มข้น', '["หวานน้อย", "หวานปกติ", "หวานมาก", "ไม่ใส่นม"]'),
('Hot Coffee', 'กาแฟร้อน', 20.00, 'beverage', true, 'กาแฟร้อน หอมกรุ่น', '["หวานน้อย", "หวานปกติ", "หวานมาก"]'),
('Fresh Orange Juice', 'น้ำส้มคั้น', 30.00, 'beverage', true, 'น้ำส้มคั้นสด ไม่ใส่น้ำตาล', '["ใส่น้ำแข็ง", "ไม่ใส่น้ำแข็ง"]'),
('Water', 'น้ำเปล่า', 10.00, 'beverage', true, 'น้ำดื่มเย็น', '[]'),
('Soft Drink', 'น้ำอัดลม', 15.00, 'beverage', true, 'น้ำอัดลมเย็น', '["โค้ก", "สไปรท์", "ส้ม", "องุ่น"]'),

-- Special items
('Chicken Rice Set A', 'ชุด A ข้าวมันไก่', 65.00, 'rice', true, 'ข้าวมันไก่ + ซุป + น้ำดื่ม', '["ไก่ต้ม", "ไก่ย่าง", "ไก่ทอด"]'),
('Chicken Rice Set B', 'ชุด B ข้าวมันไก่', 85.00, 'rice', true, 'ข้าวมันไก่ + ซุป + ไก่สะเต๊ะ + น้ำดื่ม', '["ไก่ต้ม", "ไก่ย่าง", "ไก่ทอด"]');

-- Insert some sample orders for testing (optional)
INSERT INTO orders (order_number, table_number, order_type, items, total_amount, bill_status, order_status, user_id, user_name) VALUES 
(generate_order_number(), '1', 'dine_in', 
 '[{"menu_item_id": "' || (SELECT id FROM menu_items WHERE name_th = 'ข้าวมันไก่' LIMIT 1) || '", "menu_item_name": "ข้าวมันไก่", "quantity": 2, "unit_price": 45.00, "modifiers": ["ไก่ต้ม"]}, {"menu_item_id": "' || (SELECT id FROM menu_items WHERE name_th = 'ชาเย็น' LIMIT 1) || '", "menu_item_name": "ชาเย็น", "quantity": 2, "unit_price": 20.00, "modifiers": []}]'::jsonb,
 130.00, 'UNPAID', 'PENDING', 'demo', 'พนักงานทดสอบ'),

(generate_order_number(), '2', 'dine_in', 
 '[{"menu_item_id": "' || (SELECT id FROM menu_items WHERE name_th = 'ข้าวมันไก่ย่าง' LIMIT 1) || '", "menu_item_name": "ข้าวมันไก่ย่าง", "quantity": 1, "unit_price": 50.00, "modifiers": []}, {"menu_item_id": "' || (SELECT id FROM menu_items WHERE name_th = 'กาแฟเย็น' LIMIT 1) || '", "menu_item_name": "กาแฟเย็น", "quantity": 1, "unit_price": 25.00, "modifiers": ["หวานน้อย"]}]'::jsonb,
 75.00, 'PAID', 'COMPLETED', 'demo', 'พนักงานทดสอบ');

-- Create storage bucket for menu images (run this in Supabase dashboard or via API)
-- This is just for reference, you'll need to create it via the dashboard
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', false);
*/