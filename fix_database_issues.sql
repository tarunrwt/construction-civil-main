-- Fix database schema issues
-- This script addresses the missing columns and tables reported in the console errors

-- 1. Check if assigned_at column exists in user_project_assignments table
-- If not, add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_project_assignments' 
        AND column_name = 'assigned_at'
    ) THEN
        ALTER TABLE user_project_assignments 
        ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Check if material_usage table exists
-- If not, create it
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

-- 3. Check if material_purchases table exists
-- If not, create it
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

-- 4. Check if materials table exists
-- If not, create it
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

-- 5. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_materials_user_id ON materials(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_material_usage_material_id ON material_usage(material_id);
CREATE INDEX IF NOT EXISTS idx_material_usage_project_id ON material_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_material_usage_user_id ON material_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_material_purchases_material_id ON material_purchases(material_id);
CREATE INDEX IF NOT EXISTS idx_material_purchases_user_id ON material_purchases(user_id);

-- 6. Enable RLS if not already enabled
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies if they don't exist
-- Materials policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'materials' 
        AND policyname = 'Users can view their own materials'
    ) THEN
        CREATE POLICY "Users can view their own materials" ON materials
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'materials' 
        AND policyname = 'Users can insert their own materials'
    ) THEN
        CREATE POLICY "Users can insert their own materials" ON materials
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'materials' 
        AND policyname = 'Users can update their own materials'
    ) THEN
        CREATE POLICY "Users can update their own materials" ON materials
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'materials' 
        AND policyname = 'Users can delete their own materials'
    ) THEN
        CREATE POLICY "Users can delete their own materials" ON materials
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Material usage policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'material_usage' 
        AND policyname = 'Users can view their own material usage'
    ) THEN
        CREATE POLICY "Users can view their own material usage" ON material_usage
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'material_usage' 
        AND policyname = 'Users can insert their own material usage'
    ) THEN
        CREATE POLICY "Users can insert their own material usage" ON material_usage
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'material_usage' 
        AND policyname = 'Users can update their own material usage'
    ) THEN
        CREATE POLICY "Users can update their own material usage" ON material_usage
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'material_usage' 
        AND policyname = 'Users can delete their own material usage'
    ) THEN
        CREATE POLICY "Users can delete their own material usage" ON material_usage
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Material purchases policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'material_purchases' 
        AND policyname = 'Users can view their own material purchases'
    ) THEN
        CREATE POLICY "Users can view their own material purchases" ON material_purchases
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'material_purchases' 
        AND policyname = 'Users can insert their own material purchases'
    ) THEN
        CREATE POLICY "Users can insert their own material purchases" ON material_purchases
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'material_purchases' 
        AND policyname = 'Users can update their own material purchases'
    ) THEN
        CREATE POLICY "Users can update their own material purchases" ON material_purchases
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'material_purchases' 
        AND policyname = 'Users can delete their own material purchases'
    ) THEN
        CREATE POLICY "Users can delete their own material purchases" ON material_purchases
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 8. Create triggers for updated_at if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_materials_updated_at'
    ) THEN
        CREATE TRIGGER update_materials_updated_at 
            BEFORE UPDATE ON materials
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 9. Create functions for stock management if they don't exist
CREATE OR REPLACE FUNCTION update_material_stock_on_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE materials 
    SET current_stock = current_stock - NEW.quantity_used,
        updated_at = NOW()
    WHERE id = NEW.material_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_material_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE materials 
    SET current_stock = current_stock + NEW.quantity_purchased,
        updated_at = NOW()
    WHERE id = NEW.material_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for stock management if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_stock_on_material_usage'
    ) THEN
        CREATE TRIGGER update_stock_on_material_usage
            AFTER INSERT ON material_usage
            FOR EACH ROW
            EXECUTE FUNCTION update_material_stock_on_usage();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_stock_on_material_purchase'
    ) THEN
        CREATE TRIGGER update_stock_on_material_purchase
            AFTER INSERT ON material_purchases
            FOR EACH ROW
            EXECUTE FUNCTION update_material_stock_on_purchase();
    END IF;
END $$;
