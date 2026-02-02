-- Consolidate portfolio template, theme, and other experience enhancements

-- 1. Add columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS portfolio_template TEXT DEFAULT 'modern-minimal',
ADD COLUMN IF NOT EXISTS other_experience JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS portfolio_theme TEXT DEFAULT 'modern-minimal';

-- 2. Add columns to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'modern-minimal',
ADD COLUMN IF NOT EXISTS portfolio_theme TEXT DEFAULT 'modern-minimal';

-- 3. Data consistency update (if they already exist but are null)
UPDATE profiles SET portfolio_theme = portfolio_template WHERE portfolio_theme IS NULL;
UPDATE applications SET portfolio_theme = template WHERE portfolio_theme IS NULL;

-- 4. Add comments for clarity
COMMENT ON COLUMN profiles.portfolio_template IS 'Template ID used for the public-facing portfolio (e.g., modern-minimal, professional-classic)';
COMMENT ON COLUMN profiles.other_experience IS 'Array of non-primary experience entries (volunteering, freelance, etc.) stored as JSONB';
COMMENT ON COLUMN profiles.portfolio_theme IS 'Theme ID used for the public-facing portfolio website';

COMMENT ON COLUMN applications.template IS 'Template ID used for this specific application resume (e.g., modern-minimal, professional-classic)';
COMMENT ON COLUMN applications.portfolio_theme IS 'Theme ID used for this specific application portfolio link';
