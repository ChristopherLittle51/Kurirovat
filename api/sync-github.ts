import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
    // Basic CORS and config
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const { slug, type = 'profile' } = req.query;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    // Use service role key if available for updates, otherwise fall back to anon (which might fail updates)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const githubToken = process.env.GITHUB_TOKEN || '';

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Database configuration missing on server.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        let githubUsername = '';
        let currentProjects: any[] = [];
        let targetId = '';

        if (type === 'application' && slug) {
            const { data, error } = await supabase
                .from('applications')
                .select('id, github_projects, resume_data')
                .eq('slug', slug)
                .single();

            if (error || !data) return res.status(404).json({ error: 'Application not found.' });
            
            githubUsername = (data.resume_data as any)?.github_username;
            currentProjects = (data.github_projects as any[]) || [];
            targetId = data.id;
        } else {
            // Default to profile
            const { data, error } = await supabase
                .from('profiles')
                .select('id, github_username, github_projects')
                .limit(1)
                .single();

            if (error || !data) return res.status(404).json({ error: 'Profile not found.' });

            githubUsername = data.github_username;
            currentProjects = (data.github_projects as any[]) || [];
            targetId = data.id;
        }

        if (!githubUsername) {
            return res.status(400).json({ error: 'No GitHub username associated with this record.' });
        }

        // Fetch fresh data from GitHub
        const headers: any = {};
        if (githubToken) {
            headers['Authorization'] = `token ${githubToken}`;
        }

        const ghResponse = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`, { headers });
        
        if (!ghResponse.ok) {
            return res.status(ghResponse.status).json({ error: 'Failed to fetch from GitHub.' });
        }

        const freshRepos = await ghResponse.json();
        
        // Update stargazer counts for existing projects
        const updatedProjects = currentProjects.map(p => {
            const fresh = freshRepos.find((fr: any) => fr.id === p.id || fr.name === p.name);
            return fresh ? { ...p, stargazers_count: fresh.stargazers_count } : p;
        });

        // Save back to database
        const now = new Date().toISOString();
        if (type === 'application' && slug) {
            await supabase
                .from('applications')
                .update({ 
                    github_projects: updatedProjects,
                    github_last_synced_at: now
                })
                .eq('id', targetId);
        } else {
            await supabase
                .from('profiles')
                .update({ 
                    github_projects: updatedProjects,
                    github_last_synced_at: now
                })
                .eq('id', targetId);
        }

        return res.status(200).json({ 
            success: true, 
            updatedCount: updatedProjects.length,
            lastSyncedAt: now
        });

    } catch (err: any) {
        console.error("Sync error:", err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
