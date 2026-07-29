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

/**
 * Supabase's FunctionsHttpError message is intentionally generic. The Edge
 * Function response usually contains the actionable JSON error, so decode it
 * before showing or persisting the failure.
 */
export const getEdgeFunctionErrorMessage = async (error: unknown, fallback: string): Promise<string> => {
    const candidate = error as {
        message?: unknown;
        context?: { json?: () => Promise<unknown> };
    } | null;

    try {
        const body = await candidate?.context?.json?.();
        if (body && typeof body === 'object') {
            const detail = (body as { error?: unknown; message?: unknown }).error
                ?? (body as { message?: unknown }).message;
            if (typeof detail === 'string' && detail.trim()) return detail;
        }
    } catch {
        // The response may already have been consumed; retain the SDK message.
    }

    return typeof candidate?.message === 'string' && candidate.message.trim()
        ? candidate.message
        : fallback;
};
