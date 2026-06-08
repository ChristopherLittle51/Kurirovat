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

  const supabase = createClient(supabaseUrl, supabasePublishableKey , {
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return json(res, 200, { ok: true });
  }

  try {
    const { supabase, user } = await getAuthedClient(req);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('job_leads')
        .select('*, lead_sources(label)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return json(res, 200, { leads: data });
    }

    if (req.method === 'POST') {
      const {
        id,
        leadSourceId,
        title,
        companyName,
        location,
        url,
        summary,
        rawDescription,
        provenance,
        regions,
        match,
        status,
      } = req.body || {};

      const { data, error } = await supabase
        .from('job_leads')
        .upsert({
          id,
          user_id: user.id,
          lead_source_id: leadSourceId || null,
          title,
          company_name: companyName,
          location,
          url,
          summary,
          raw_description: rawDescription,
          provenance: provenance || {},
          regions: regions || [],
          match: match || {},
          status: status || 'new',
        })
        .select()
        .single();

      if (error) throw error;
      return json(res, 200, { lead: data });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error: any) {
    console.error('job-leads api error:', error);
    return json(res, 400, { error: error.message || 'Unknown error' });
  }
}
