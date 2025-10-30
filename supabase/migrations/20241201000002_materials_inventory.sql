-- Create materials table
CREATE TABLE materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- e.g., 'kg', 'pieces', 'cubic meters', 'liters'
    cost_per_unit DECIMAL(10,2) NOT NULL,
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(255),
    min_stock_level INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create material_usage table to track material consumption
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

-- Create material_purchases table to track material purchases
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

-- Create indexes for better performance
CREATE INDEX idx_materials_user_id ON materials(user_id);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_material_usage_material_id ON material_usage(material_id);
CREATE INDEX idx_material_usage_project_id ON material_usage(project_id);
CREATE INDEX idx_material_usage_user_id ON material_usage(user_id);
CREATE INDEX idx_material_purchases_material_id ON material_purchases(material_id);
CREATE INDEX idx_material_purchases_user_id ON material_purchases(user_id);

-- Enable Row Level Security
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for materials
CREATE POLICY "Users can view their own materials" ON materials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own materials" ON materials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials" ON materials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials" ON materials
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for material_usage
CREATE POLICY "Users can view their own material usage" ON material_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own material usage" ON material_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own material usage" ON material_usage
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own material usage" ON material_usage
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for material_purchases
CREATE POLICY "Users can view their own material purchases" ON material_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own material purchases" ON material_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own material purchases" ON material_purchases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own material purchases" ON material_purchases
    FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update stock levels when material is used
CREATE OR REPLACE FUNCTION update_material_stock_on_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current stock when material is used
    UPDATE materials 
    SET current_stock = current_stock - NEW.quantity_used,
        updated_at = NOW()
    WHERE id = NEW.material_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stock on usage
CREATE TRIGGER update_stock_on_material_usage
    AFTER INSERT ON material_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_material_stock_on_usage();

-- Create function to update stock levels when material is purchased
CREATE OR REPLACE FUNCTION update_material_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current stock when material is purchased
    UPDATE materials 
    SET current_stock = current_stock + NEW.quantity_purchased,
        updated_at = NOW()
    WHERE id = NEW.material_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stock on purchase
CREATE TRIGGER update_stock_on_material_purchase
    AFTER INSERT ON material_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_material_stock_on_purchase();
