import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
    // Basic CORS and config
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const { slug } = req.query;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ error: 'Database configuration missing on server.' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
        if (slug) {
            // Fetch specific tailored portfolio application
            const { data, error } = await supabase
                .from('applications')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error || !data) {
                return res.status(404).json({ error: 'Portfolio not found.' });
            }

            // Transform data DB snake_case to app camelCase JSON format
            const tailoredProfile = {
                id: data.id,
                createdAt: new Date(data.created_at).getTime(),
                jobDescription: {
                    companyName: data.company_name,
                    roleTitle: data.role_title,
                    rawText: data.raw_job_description,
                },
                resume: data.resume_data,
                coverLetter: data.cover_letter,
                matchScore: data.match_score,
                keyKeywords: data.key_keywords,
                searchSources: data.search_sources,
                status: data.status,
                slug: data.slug,
                githubProjects: data.github_projects,
                showMatchScore: data.show_match_score,
                template: data.template,
                portfolioTheme: data.portfolio_theme,
                profilePhotoUrl: data.profile_photo_url,
            };

            return res.status(200).json(tailoredProfile);
        } else {
            // Fetch global profile for root resume request
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .limit(1)
                .single();

            if (error || !data) {
                return res.status(404).json({ error: 'Profile not found.' });
            }

            // Transform data DB snake_case to app camelCase JSON format
            const userProfile = {
                fullName: data.full_name,
                email: data.email,
                location: data.location,
                phone: data.phone,
                summary: data.summary,
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
            };

            return res.status(200).json(userProfile);
        }
    } catch (err: any) {
        console.error("API error:", err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
