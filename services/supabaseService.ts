import { supabase } from './supabaseClient';
import { UserProfile, TailoredApplication, JobDescription } from '../types';

export const getProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error fetching profile:', error);
        return null;
    }

    // Convert snake_case from DB to camelCase for app
    return {
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
    };
};

export const saveProfile = async (userId: string, profile: UserProfile): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            full_name: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            location: profile.location,
            summary: profile.summary,
            skills: profile.skills,
            experience: profile.experience,
            education: profile.education,
            links: profile.links,
            github_username: profile.githubUsername,
            other_experience: profile.otherExperience,
            portfolio_template: profile.portfolioTemplate,
            portfolio_theme: profile.portfolioTheme,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error('Error saving profile:', error);
        throw error;
    }
};

export const getApplications = async (userId: string): Promise<TailoredApplication[]> => {
    const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications:', error);
        return [];
    }

    return data.map((app: any) => ({
        id: app.id,
        createdAt: new Date(app.created_at).getTime(),
        jobDescription: {
            companyName: app.company_name,
            roleTitle: app.role_title,
            rawText: app.raw_job_description,
        },
        resume: app.resume_data,
        coverLetter: app.cover_letter,
        matchScore: app.match_score,
        keyKeywords: app.key_keywords,
        searchSources: app.search_sources,
        status: app.status,
        slug: app.slug,
        githubProjects: app.github_projects,
        showMatchScore: app.show_match_score,
        template: app.template,
        portfolioTheme: app.portfolio_theme,
    }));
};

export const saveApplication = async (userId: string, application: TailoredApplication): Promise<void> => {
    // Slug is now handled by DB trigger if not present

    const { error } = await supabase
        .from('applications')
        .insert({
            user_id: userId,
            company_name: application.jobDescription.companyName,
            role_title: application.jobDescription.roleTitle,
            raw_job_description: application.jobDescription.rawText,
            resume_data: application.resume,
            cover_letter: application.coverLetter,
            match_score: application.matchScore,
            key_keywords: application.keyKeywords,
            search_sources: application.searchSources,
            status: application.status || 'Pending',
            github_projects: application.githubProjects,
            show_match_score: application.showMatchScore,
            template: application.template,
            portfolio_theme: application.portfolioTheme
        });

    if (error) {
        console.error('Error saving application:', error);
        throw error;
    }
};

export const updateApplication = async (appId: string, updates: Partial<TailoredApplication>): Promise<void> => {
    const updatePayload: any = {};

    if (updates.resume) updatePayload.resume_data = updates.resume;
    if (updates.coverLetter) updatePayload.cover_letter = updates.coverLetter;
    if (updates.status) updatePayload.status = updates.status;
    if (updates.template) updatePayload.template = updates.template;
    if (updates.portfolioTheme) updatePayload.portfolio_theme = updates.portfolioTheme;
    // Add other fields as necessary, but these are the main editable ones

    if (Object.keys(updatePayload).length === 0) return;

    const { error } = await supabase
        .from('applications')
        .update(updatePayload)
        .eq('id', appId);

    if (error) {
        console.error('Error updating application:', error);
        throw error;
    }
};

export const updateApplicationStatus = async (appId: string, status: string): Promise<void> => {
    return updateApplication(appId, { status: status as any });
};

export const getApplicationBySlug = async (slug: string): Promise<TailoredApplication | null> => {
    const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching application by slug:', error);
        return null;
    }

    return {
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
    };
}

export const deleteApplication = async (appId: string): Promise<void> => {
    const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', appId);

    if (error) {
        console.error('Error deleting application:', error);
        throw error;
    }
}
