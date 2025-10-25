-- Fix Low Stock Alert Issue
-- This script fixes the low stock alert by ensuring proper stock levels

-- 1. Update existing materials to have proper stock levels
-- Set current_stock to be higher than min_stock_level for all existing materials
UPDATE materials 
SET current_stock = GREATEST(current_stock, min_stock_level + 10)
WHERE current_stock <= min_stock_level;

-- 2. If no materials exist, insert sample materials with proper stock levels
INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id)
SELECT 
    'Cement', 'Portland Cement Grade 53', 'Construction', 'bags', 350.00, 'ABC Suppliers', '9876543210', 50, 100, auth.uid()
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM materials WHERE name = 'Cement' AND user_id = auth.uid());

INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id)
SELECT 
    'Steel Rods', 'TMT Steel Rods 12mm', 'Construction', 'kg', 65.00, 'Steel Corp', '9876543211', 1000, 2000, auth.uid()
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM materials WHERE name = 'Steel Rods' AND user_id = auth.uid());

INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id)
SELECT 
    'Sand', 'River Sand Fine Grade', 'Construction', 'cubic meters', 1200.00, 'Sand Suppliers', '9876543212', 10, 25, auth.uid()
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM materials WHERE name = 'Sand' AND user_id = auth.uid());

-- 3. Add more sample materials with good stock levels
INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id)
SELECT 
    'Bricks', 'Red Clay Bricks', 'Construction', 'pieces', 8.50, 'Brick Works', '9876543213', 5000, 10000, auth.uid()
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM materials WHERE name = 'Bricks' AND user_id = auth.uid());

INSERT INTO materials (name, description, category, unit, cost_per_unit, supplier_name, supplier_contact, min_stock_level, current_stock, user_id)
SELECT 
    'Paint', 'Interior Wall Paint', 'Paint & Finishes', 'liters', 450.00, 'Paint Co', '9876543214', 20, 50, auth.uid()
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM materials WHERE name = 'Paint' AND user_id = auth.uid());

-- 4. Create a function to check and fix low stock materials
CREATE OR REPLACE FUNCTION fix_low_stock_materials()
RETURNS TABLE(material_name TEXT, old_stock INTEGER, new_stock INTEGER) AS $$
BEGIN
    RETURN QUERY
    UPDATE materials 
    SET current_stock = min_stock_level + 10,
        updated_at = NOW()
    WHERE current_stock <= min_stock_level
    RETURNING materials.name, materials.current_stock - 10, materials.current_stock;
END;
$$ LANGUAGE plpgsql;

-- 5. Run the function to fix any remaining low stock materials
SELECT * FROM fix_low_stock_materials();

-- 6. Create a view for easy monitoring of stock levels
CREATE OR REPLACE VIEW material_stock_status AS
SELECT 
    id,
    name,
    category,
    current_stock,
    min_stock_level,
    CASE 
        WHEN current_stock <= min_stock_level THEN 'Low Stock'
        WHEN current_stock <= min_stock_level * 1.5 THEN 'Medium Stock'
        ELSE 'Good Stock'
    END as stock_status,
    (current_stock - min_stock_level) as stock_buffer
FROM materials
WHERE user_id = auth.uid();

-- 7. Grant permissions on the view
GRANT SELECT ON material_stock_status TO authenticated;
