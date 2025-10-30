-- Fix Material Inventory 400 Errors
-- This script addresses the material_purchases and material_usage table issues

-- 1. Drop existing tables if they exist (to recreate with proper structure)
DROP TABLE IF EXISTS material_purchases CASCADE;
DROP TABLE IF EXISTS material_usage CASCADE;
DROP TABLE IF EXISTS materials CASCADE;

-- 2. Create materials table
CREATE TABLE materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(255),
    min_stock_level INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create material_usage table
CREATE TABLE material_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    daily_report_id UUID REFERENCES daily_reports(id) ON DELETE SET NULL,
    quantity_used DECIMAL(10,2) NOT NULL,
    usage_date DATE NOT NULL,
    notes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create material_purchases table
CREATE TABLE material_purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity_purchased DECIMAL(10,2) NOT NULL,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    purchase_date DATE NOT NULL,
    supplier_name VARCHAR(255),
    invoice_number VARCHAR(255),
    notes TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX idx_materials_user_id ON materials(user_id);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_material_usage_user_id ON material_usage(user_id);
CREATE INDEX idx_material_usage_material_id ON material_usage(material_id);
CREATE INDEX idx_material_usage_project_id ON material_usage(project_id);
CREATE INDEX idx_material_purchases_user_id ON material_purchases(user_id);
CREATE INDEX idx_material_purchases_material_id ON material_purchases(material_id);

-- 6. Enable RLS on all tables
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for materials table
DROP POLICY IF EXISTS "Users can view their own materials" ON materials;
CREATE POLICY "Users can view their own materials" ON materials
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own materials" ON materials;
CREATE POLICY "Users can insert their own materials" ON materials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own materials" ON materials;
CREATE POLICY "Users can update their own materials" ON materials
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own materials" ON materials;
CREATE POLICY "Users can delete their own materials" ON materials
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Create RLS policies for material_usage table
DROP POLICY IF EXISTS "Users can view their own material usage" ON material_usage;
CREATE POLICY "Users can view their own material usage" ON material_usage
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own material usage" ON material_usage;
CREATE POLICY "Users can insert their own material usage" ON material_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own material usage" ON material_usage;
CREATE POLICY "Users can update their own material usage" ON material_usage
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own material usage" ON material_usage;
CREATE POLICY "Users can delete their own material usage" ON material_usage
    FOR DELETE USING (auth.uid() = user_id);

-- 9. Create RLS policies for material_purchases table
DROP POLICY IF EXISTS "Users can view their own material purchases" ON material_purchases;
CREATE POLICY "Users can view their own material purchases" ON material_purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own material purchases" ON material_purchases;
CREATE POLICY "Users can insert their own material purchases" ON material_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own material purchases" ON material_purchases;
CREATE POLICY "Users can update their own material purchases" ON material_purchases
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own material purchases" ON material_purchases;
CREATE POLICY "Users can delete their own material purchases" ON material_purchases
    FOR DELETE USING (auth.uid() = user_id);

-- 10. Insert some sample materials for testing
INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id)
SELECT 
    'Cement', 'Portland Cement Grade 53', 'Construction', 'bags', 350.00, 'ABC Suppliers', '9876543210', 50, 100, auth.uid()
WHERE auth.uid() IS NOT NULL;

INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id)
SELECT 
    'Steel Rods', 'TMT Steel Rods 12mm', 'Construction', 'kg', 65.00, 'Steel Corp', '9876543211', 1000, 2000, auth.uid()
WHERE auth.uid() IS NOT NULL;

INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id)
SELECT 
    'Sand', 'River Sand Fine Grade', 'Construction', 'cubic meters', 1200.00, 'Sand Suppliers', '9876543212', 10, 25, auth.uid()
WHERE auth.uid() IS NOT NULL;

-- 11. Create function to update material stock after usage
CREATE OR REPLACE FUNCTION update_material_stock_after_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE materials 
    SET current_stock = current_stock - NEW.quantity_used,
        updated_at = NOW()
    WHERE id = NEW.material_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create function to update material stock after purchase
CREATE OR REPLACE FUNCTION update_material_stock_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE materials 
    SET current_stock = current_stock + NEW.quantity_purchased,
        updated_at = NOW()
    WHERE id = NEW.material_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Create triggers
DROP TRIGGER IF EXISTS trigger_update_stock_after_usage ON material_usage;
CREATE TRIGGER trigger_update_stock_after_usage
    AFTER INSERT ON material_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_material_stock_after_usage();

DROP TRIGGER IF EXISTS trigger_update_stock_after_purchase ON material_purchases;
CREATE TRIGGER trigger_update_stock_after_purchase
    AFTER INSERT ON material_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_material_stock_after_purchase();

-- 14. Grant necessary permissions
GRANT ALL ON materials TO authenticated;
GRANT ALL ON material_usage TO authenticated;
GRANT ALL ON material_purchases TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
