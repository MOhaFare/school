-- Add features column to schools table
-- Stores an array of enabled feature keys (e.g., ["transport", "hostel"])
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '["dashboard", "front-office", "student-info", "academics", "live-classes", "lesson-plan", "homework", "download-center", "hr", "fees", "finance", "attendance", "exams", "online-exams", "communicate", "library", "inventory", "transport", "hostel", "certificate", "alumni", "reports", "settings"]'::jsonb;

-- Ensure existing schools have all features enabled by default to prevent disruption
UPDATE schools 
SET features = '["dashboard", "front-office", "student-info", "academics", "live-classes", "lesson-plan", "homework", "download-center", "hr", "fees", "finance", "attendance", "exams", "online-exams", "communicate", "library", "inventory", "transport", "hostel", "certificate", "alumni", "reports", "settings"]'::jsonb 
WHERE features IS NULL;
