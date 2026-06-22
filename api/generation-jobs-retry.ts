import { waitUntil } from '@vercel/functions';
import { createClient } from '@supabase/supabase-js';

const json = (res: any, status: number, body: unknown) => {
  res.status(status).json(body);
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const kickGenerationJob = async (jobId: string, userId: string) => {
  if (!supabaseUrl || !serviceRoleKey) return;

  const response = await fetch(`${supabaseUrl}/functions/v1/gemini-api`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'processGenerationJob',
      payload: { jobId, userId },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Generation worker retry failed: ${body}`);
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 200, { retried: 0, skipped: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const staleCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: jobs, error } = await supabase
      .from('generation_jobs')
      .select('id,user_id,status,updated_at,attempt_count')
      .or(`status.eq.queued,status.eq.failed,and(status.eq.running,updated_at.lt.${staleCutoff})`)
      .lt('attempt_count', 3)
      .order('created_at', { ascending: true })
      .limit(3);

    if (error) throw error;

    const retryPromises = (jobs || []).map((job) =>
      kickGenerationJob(job.id, job.user_id).catch((retryError) => {
        console.error('generation retry failed:', job.id, retryError);
      }),
    );

    waitUntil(Promise.all(retryPromises));

    return json(res, 200, { retried: jobs?.length || 0 });
  } catch (error: any) {
    console.error('generation-jobs retry api error:', error);
    return json(res, 500, { error: error.message || 'Unknown error' });
  }
}
