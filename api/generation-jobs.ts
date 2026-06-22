import { waitUntil } from '@vercel/functions';
import { createClient } from '@supabase/supabase-js';

const json = (res: any, status: number, body: unknown) => {
  res.status(status).json(body);
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const normalizeProfile = (data: any) => ({
  fullName: data.full_name || '',
  email: data.email || '',
  location: data.location || '',
  phone: data.phone || '',
  summary: data.summary || '',
  skills: data.skills || [],
  experience: data.experience || [],
  education: data.education || [],
  links: data.links || [],
  githubUsername: data.github_username,
  otherExperience: data.other_experience || [],
  portfolioTemplate: data.portfolio_template,
  portfolioTheme: data.portfolio_theme,
  profilePhotoUrl: data.profile_photo_url,
  githubProjects: data.github_projects || [],
  githubLastSyncedAt: data.github_last_synced_at,
  achievementBank: data.achievement_bank || [],
  tailoringPlaybooks: data.tailoring_playbooks || [],
  importedProfileSources: data.imported_profile_sources || [],
  targetRoles: data.target_roles || [],
  preferredIndustries: data.preferred_industries || [],
  targetRegions: data.target_regions || [],
  antiClaims: data.anti_claims || [],
  learnedPreferenceSuggestions: data.learned_preference_suggestions || [],
});

const kickGenerationJob = async (jobId: string, token: string) => {
  if (!supabaseUrl) throw new Error('Supabase URL is missing.');

  const response = await fetch(`${supabaseUrl}/functions/v1/gemini-api`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'processGenerationJob',
      payload: { jobId },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Generation worker failed to start: ${body}`);
  }
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return json(res, 200, { ok: true });
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    if (!supabaseUrl || !supabasePublishableKey) {
      throw new Error('Database configuration missing on server.');
    }
    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Missing bearer token.');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabasePublishableKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found. Please complete onboarding.');
    }

    const { jd, projects = [], showScore = true, options, leadContext } = req.body || {};
    if (!jd?.companyName || !jd?.roleTitle || !jd?.rawText) {
      throw new Error('Company, role title, and job description are required.');
    }

    const requestPayload = {
      baseProfile: normalizeProfile(profile),
      jd,
      githubProjects: projects,
      includeScore: showScore,
      targetPageCount: 1,
      options,
      leadContext,
    };

    const { data: job, error: insertError } = await supabase
      .from('generation_jobs')
      .insert({
        user_id: user.id,
        status: 'queued',
        stage: 'Queued',
        progress: 0,
        request_payload: requestPayload,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    waitUntil(kickGenerationJob(job.id, token).catch((error) => {
      console.error('generation job kickoff failed:', error);
    }));

    return json(res, 202, { job });
  } catch (error: any) {
    console.error('generation-jobs api error:', error);
    return json(res, 400, { error: error.message || 'Unknown error' });
  }
}
