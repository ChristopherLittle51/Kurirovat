import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
    console.warn("Supabase URL or Publishable Key is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.");
}

// Ensure createClient doesn't crash app if vars are missing (even if it won't work)
// providing a dummy URL if missing to satisfy constructor, though requests will fail.
const validUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = supabasePublishableKey || 'placeholder';

export const supabase = createClient(validUrl, validKey);
