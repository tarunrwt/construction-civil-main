-- Fix Data Connectivity Issues
-- This script ensures all data connections between frontend and backend are working properly

-- 1. Ensure all tables exist with proper structure
CREATE TABLE IF NOT EXISTS materials (
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

CREATE TABLE IF NOT EXISTS material_usage (
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

CREATE TABLE IF NOT EXISTS material_purchases (
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

-- 2. Enable RLS on all tables
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for materials table
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

-- 4. Create RLS policies for material_usage table
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

-- 5. Create RLS policies for material_purchases table
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

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_material_usage_user_id ON material_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_material_usage_material_id ON material_usage(material_id);
CREATE INDEX IF NOT EXISTS idx_material_usage_project_id ON material_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_material_purchases_user_id ON material_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_material_purchases_material_id ON material_purchases(material_id);

-- 7. Create function to update material stock after usage
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

-- 8. Create function to update material stock after purchase
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

-- 9. Create triggers
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

-- 10. Insert sample materials with proper stock levels for testing
INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id)
SELECT 
    'Cement', 'Portland Cement Grade 53', 'Cement & Concrete', 'bags', 500.00, 'ABC Suppliers', '9876543210', 50, 100, auth.uid()
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM materials WHERE name = 'Cement' AND user_id = auth.uid());

INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id)
SELECT 
    'Concrete', 'Ready Mix Concrete', 'Cement & Concrete', 'bags', 500.00, 'Concrete Corp', '9876543211', 100, 200, auth.uid()
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM materials WHERE name = 'Concrete' AND user_id = auth.uid());

INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id)
SELECT 
    'Steel Rods', 'TMT Steel Rods 12mm', 'Steel & Reinforcement', 'kg', 65.00, 'Steel Corp', '9876543212', 1000, 2000, auth.uid()
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM materials WHERE name = 'Steel Rods' AND user_id = auth.uid());

INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id)
SELECT 
    'Sand', 'River Sand Fine Grade', 'Sand & Aggregates', 'cubic meters', 1200.00, 'Sand Suppliers', '9876543213', 10, 25, auth.uid()
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM materials WHERE name = 'Sand' AND user_id = auth.uid());

-- 11. Insert sample material usage for testing
INSERT INTO material_usage (material_id, project_id, quantity_used, usage_date, notes, user_id)
SELECT 
    m.id, 
    p.id, 
    5.00, 
    CURRENT_DATE - INTERVAL '1 day',
    'Used for foundation work',
    auth.uid()
FROM materials m, projects p
WHERE m.name = 'Cement' 
AND m.user_id = auth.uid()
AND p.user_id = auth.uid()
AND NOT EXISTS (
    SELECT 1 FROM material_usage mu 
    WHERE mu.material_id = m.id 
    AND mu.project_id = p.id 
    AND mu.user_id = auth.uid()
)
LIMIT 1;

-- 12. Insert sample material purchases for testing
INSERT INTO material_purchases (material_id, quantity_purchased, cost_per_unit, total_cost, purchase_date, supplier_name, invoice_number, notes, user_id)
SELECT 
    m.id, 
    50.00, 
    500.00, 
    25000.00, 
    CURRENT_DATE - INTERVAL '2 days',
    'ABC Suppliers',
    'INV-001',
    'Bulk purchase for project',
    auth.uid()
FROM materials m
WHERE m.name = 'Cement' 
AND m.user_id = auth.uid()
AND NOT EXISTS (
    SELECT 1 FROM material_purchases mp 
    WHERE mp.material_id = m.id 
    AND mp.user_id = auth.uid()
)
LIMIT 1;

-- 13. Grant necessary permissions
GRANT ALL ON materials TO authenticated;
GRANT ALL ON material_usage TO authenticated;
GRANT ALL ON material_purchases TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 14. Create a view for material analytics
CREATE OR REPLACE VIEW material_analytics AS
SELECT 
    m.user_id,
    COUNT(m.id) as total_materials,
    SUM(m.current_stock * m.cost_per_unit) as total_inventory_value,
    COUNT(CASE WHEN m.current_stock <= m.min_stock_level THEN 1 END) as low_stock_items,
    COALESCE(SUM(mp.total_cost), 0) as total_purchases
FROM materials m
LEFT JOIN material_purchases mp ON m.user_id = mp.user_id
WHERE m.user_id = auth.uid()
GROUP BY m.user_id;

-- 15. Grant permissions on the view
GRANT SELECT ON material_analytics TO authenticated;
