import { createClient } from '@supabase/supabase-js';

const json = (res: any, status: number, body: unknown) => {
  res.status(status).json(body);
};

const getAuthedClient = async (req: any) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  const authHeader = req.headers.authorization || '';

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Database configuration missing on server.');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Missing bearer token.');
  }

  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return { supabase, user };
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');

  if (req.method === 'OPTIONS') {
    return json(res, 200, { ok: true });
  }

  try {
    const { supabase, user } = await getAuthedClient(req);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: checks, error: checksError } = await supabase
        .from('lead_source_checks')
        .select('id, lead_source_id, status, checked_at, notes, discovered_count, lead_sources!inner(user_id, label)')
        .eq('lead_sources.user_id', user.id)
        .order('checked_at', { ascending: false });

      if (checksError) throw checksError;

      return json(res, 200, { sources: data, checks });
    }

    if (req.method === 'POST') {
      const { id, label, url, sourceType, regions, notes } = req.body || {};
      const { data, error } = await supabase
        .from('lead_sources')
        .upsert({
          id,
          user_id: user.id,
          label,
          url,
          source_type: sourceType || 'other',
          regions: regions || [],
          notes: notes || '',
        })
        .select()
        .single();

      if (error) throw error;
      return json(res, 200, { source: data });
    }

    if (req.method === 'PUT') {
      const { leadSourceId, status, notes, discoveredCount } = req.body || {};
      const { data, error } = await supabase
        .from('lead_source_checks')
        .insert({
          lead_source_id: leadSourceId,
          status: status || 'pending',
          notes: notes || '',
          discovered_count: discoveredCount || 0,
        })
        .select()
        .single();

      if (error) throw error;
      const { error: updateError } = await supabase
        .from('lead_sources')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', leadSourceId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      return json(res, 200, { check: data });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error: any) {
    console.error('lead-sources api error:', error);
    return json(res, 400, { error: error.message || 'Unknown error' });
  }
}
