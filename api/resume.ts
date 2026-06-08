import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
    // Basic CORS and config
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const { slug } = req.query;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

    if (!supabaseUrl || !supabasePublishableKey) {
        return res.status(500).json({ error: 'Database configuration missing on server.' });
    }

    const supabase = createClient(supabaseUrl, supabasePublishableKey);

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
                githubLastSyncedAt: data.github_last_synced_at,
                jobAnalysis: data.job_analysis,
                evidenceResolution: data.evidence_resolution,
                diagnostics: data.diagnostics,
                rewriteInsights: data.rewrite_insights,
                assembledPromptPreview: data.prompt_preview,
                promptOverride: data.generation_options?.promptOverride || data.generation_options?.promptPreviewOverride || '',
                selectedPlaybookId: data.selected_playbook_id,
                generationOptions: data.generation_options,
                editSuggestions: data.edit_suggestions,
                regenerationHistory: data.regeneration_history,
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
                githubLastSyncedAt: data.github_last_synced_at,
                achievementBank: data.achievement_bank || [],
                tailoringPlaybooks: (data.tailoring_playbooks || []).map((playbook: any) => ({
                    ...playbook,
                    promptOverride: playbook.promptOverride || playbook.promptOverrides || '',
                })),
                importedProfileSources: data.imported_profile_sources || [],
                targetRoles: data.target_roles || [],
                preferredIndustries: data.preferred_industries || [],
                targetRegions: data.target_regions || [],
                antiClaims: data.anti_claims || [],
                learnedPreferenceSuggestions: data.learned_preference_suggestions || [],
            };

            return res.status(200).json(userProfile);
        }
    } catch (err: any) {
        console.error("API error:", err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
