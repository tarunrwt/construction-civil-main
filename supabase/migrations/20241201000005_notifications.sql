-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, warning, error, success
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info',
    p_action_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    VALUES (p_user_id, p_title, p_message, p_type, p_action_url, p_metadata)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, read_at = NOW()
    WHERE id = p_notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = auth.uid() AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic notifications
CREATE OR REPLACE FUNCTION notify_project_deadline_approaching()
RETURNS TRIGGER AS $$
DECLARE
    days_remaining INTEGER;
BEGIN
    -- Check if project deadline is approaching (within 7 days)
    IF NEW.target_end_date IS NOT NULL THEN
        days_remaining := EXTRACT(DAYS FROM NEW.target_end_date - CURRENT_DATE);
        
        IF days_remaining <= 7 AND days_remaining >= 0 THEN
            PERFORM create_notification(
                NEW.user_id,
                'Project Deadline Approaching',
                'Project "' || NEW.name || '" deadline is in ' || days_remaining || ' days.',
                'warning',
                '/projects/' || NEW.id::text
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_project_deadline_trigger
    AFTER UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION notify_project_deadline_approaching();

-- Create trigger for budget overrun notifications
CREATE OR REPLACE FUNCTION notify_budget_overrun()
RETURNS TRIGGER AS $$
DECLARE
    project_total_cost DECIMAL;
    project_budget DECIMAL;
    overrun_percentage DECIMAL;
BEGIN
    -- Get project budget
    SELECT total_cost INTO project_budget
    FROM projects
    WHERE id = NEW.project_id;
    
    -- Calculate total spent on project
    SELECT COALESCE(SUM(cost), 0) INTO project_total_cost
    FROM daily_reports
    WHERE project_id = NEW.project_id;
    
    -- Check if budget is exceeded by more than 10%
    IF project_budget > 0 AND project_total_cost > project_budget THEN
        overrun_percentage := ((project_total_cost - project_budget) / project_budget) * 100;
        
        IF overrun_percentage > 10 THEN
            PERFORM create_notification(
                NEW.user_id,
                'Budget Overrun Alert',
                'Project budget exceeded by ' || ROUND(overrun_percentage, 1) || '%.',
                'error',
                '/financials'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_budget_overrun_trigger
    AFTER INSERT ON daily_reports
    FOR EACH ROW
    EXECUTE FUNCTION notify_budget_overrun();

-- Create trigger for low stock notifications
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if material stock is below minimum level
    IF NEW.current_stock <= NEW.min_stock_level AND OLD.current_stock > OLD.min_stock_level THEN
        PERFORM create_notification(
            NEW.user_id,
            'Low Stock Alert',
            'Material "' || NEW.name || '" is below minimum stock level.',
            'warning',
            '/materials'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_low_stock_trigger
    AFTER UPDATE ON materials
    FOR EACH ROW
    EXECUTE FUNCTION notify_low_stock();
