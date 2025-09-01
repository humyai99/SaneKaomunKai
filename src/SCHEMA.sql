-- Sanae Hainanese Chicken Rice POS Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE order_type AS ENUM ('dine_in', 'takeaway', 'delivery');
CREATE TYPE order_status AS ENUM ('PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED');
CREATE TYPE bill_status AS ENUM ('UNPAID', 'PAID');
CREATE TYPE ticket_status AS ENUM ('PENDING', 'IN_PROGRESS', 'READY');
CREATE TYPE station_type AS ENUM ('kitchen', 'tea');
CREATE TYPE priority_level AS ENUM ('NORMAL', 'HIGH');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer');
CREATE TYPE menu_category AS ENUM ('rice', 'noodles', 'appetizer', 'dessert', 'beverage', 'tea');

-- Menu Items Table
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  price DECIMAL(8,2) NOT NULL CHECK (price >= 0),
  category menu_category NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT TRUE,
  description TEXT,
  modifiers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  table_number TEXT,
  order_type order_type NOT NULL,
  contact_info TEXT,
  delivery_platform TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  bill_status bill_status DEFAULT 'UNPAID',
  order_status order_status DEFAULT 'PENDING',
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets Table (for KDS)
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  station station_type NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status ticket_status DEFAULT 'PENDING',
  priority priority_level DEFAULT 'NORMAL',
  estimated_time INTEGER, -- in minutes
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  table_number TEXT,
  order_type order_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  method payment_method NOT NULL,
  reference_number TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_bill_status ON orders(bill_status);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_table_number ON orders(table_number);
CREATE INDEX idx_tickets_station ON tickets(station);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(available);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all operations for authenticated users (since we're using anon key with custom auth)
CREATE POLICY "Allow all for authenticated users" ON menu_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON tickets FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON payments FOR ALL USING (true);

-- Realtime subscriptions
-- Enable realtime for the tables we need
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- Functions for better data integrity
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(NOW(), 'DDMMHH24MI') || LPAD(FLOOR(RANDOM() * 100)::TEXT, 2, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to create tickets when order is created
CREATE OR REPLACE FUNCTION create_tickets_for_order()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  kitchen_items JSONB := '[]'::jsonb;
  tea_items JSONB := '[]'::jsonb;
BEGIN
  -- Loop through order items and categorize by station
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    -- Get menu item category to determine station
    IF EXISTS (
      SELECT 1 FROM menu_items 
      WHERE id::text = (item->>'menu_item_id') 
      AND category = 'rice'
    ) THEN
      kitchen_items := kitchen_items || item;
    ELSE
      tea_items := tea_items || item;
    END IF;
  END LOOP;

  -- Create kitchen ticket if there are kitchen items
  IF jsonb_array_length(kitchen_items) > 0 THEN
    INSERT INTO tickets (
      order_id, order_number, station, items, table_number, order_type
    ) VALUES (
      NEW.id, NEW.order_number, 'kitchen', kitchen_items, NEW.table_number, NEW.order_type
    );
  END IF;

  -- Create tea station ticket if there are tea/beverage items
  IF jsonb_array_length(tea_items) > 0 THEN
    INSERT INTO tickets (
      order_id, order_number, station, items, table_number, order_type
    ) VALUES (
      NEW.id, NEW.order_number, 'tea', tea_items, NEW.table_number, NEW.order_type
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create tickets when order is created
CREATE TRIGGER create_tickets_after_order_insert
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_tickets_for_order();

-- Function to update order status based on ticket status
CREATE OR REPLACE FUNCTION update_order_status_from_tickets()
RETURNS TRIGGER AS $$
DECLARE
  all_ready BOOLEAN;
  has_in_progress BOOLEAN;
BEGIN
  -- Check if all tickets for this order are READY
  SELECT 
    NOT EXISTS (SELECT 1 FROM tickets WHERE order_id = NEW.order_id AND status != 'READY'),
    EXISTS (SELECT 1 FROM tickets WHERE order_id = NEW.order_id AND status = 'IN_PROGRESS')
  INTO all_ready, has_in_progress;

  -- Update order status accordingly
  IF all_ready THEN
    UPDATE orders SET order_status = 'READY' WHERE id = NEW.order_id;
  ELSIF has_in_progress THEN
    UPDATE orders SET order_status = 'IN_PROGRESS' WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update order status when ticket status changes
CREATE TRIGGER update_order_status_after_ticket_update
  AFTER UPDATE OF status ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_from_tickets();