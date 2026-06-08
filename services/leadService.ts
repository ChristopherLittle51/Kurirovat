import { supabase } from './supabaseClient';
import {
    ApplicationLeadContext,
    JobLead,
    LeadSource,
    LeadSourceCheck,
} from '../types';
import {
    getJobLeads,
    getLeadSourceChecks,
    getLeadSources,
    recordLeadSourceCheck as recordLeadSourceCheckInDb,
    saveJobLead as saveJobLeadInDb,
    saveLeadSource as saveLeadSourceInDb,
} from './supabaseService';

const requireUserId = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        throw new Error('You must be signed in to manage leads.');
    }
    return user.id;
};

export const listLeadSources = async (): Promise<LeadSource[]> => {
    const userId = await requireUserId();
    return getLeadSources(userId);
};

export const listLeadSourceChecks = async (): Promise<LeadSourceCheck[]> => {
    const userId = await requireUserId();
    return getLeadSourceChecks(userId);
};

export const saveLeadSource = async (source: LeadSource): Promise<LeadSource> => {
    const userId = await requireUserId();
    await saveLeadSourceInDb(userId, source);
    return source;
};

export const recordLeadSourceCheck = async (check: {
    leadSourceId: string;
    status: LeadSourceCheck['status'];
    notes?: string;
    discoveredCount?: number;
}): Promise<LeadSourceCheck> => {
    const userId = await requireUserId();
    return recordLeadSourceCheckInDb(userId, check);
};

export const listJobLeads = async (): Promise<JobLead[]> => {
    const userId = await requireUserId();
    return getJobLeads(userId);
};

export const saveJobLead = async (lead: JobLead): Promise<JobLead> => {
    const userId = await requireUserId();
    await saveJobLeadInDb(userId, lead);
    return lead;
};

export const convertLeadToApplication = (lead: JobLead): {
    jobDescription: {
        companyName: string;
        roleTitle: string;
        rawText: string;
    };
    leadContext: ApplicationLeadContext;
} => ({
    jobDescription: {
        companyName: lead.companyName,
        roleTitle: lead.title,
        rawText: lead.rawDescription || `${lead.summary}\n\nLocation: ${lead.location}\nSource: ${lead.url}`,
    },
    leadContext: {
        leadId: lead.id,
        leadSourceId: lead.leadSourceId,
        leadSourceLabel: lead.leadSourceLabel,
        leadUrl: lead.url,
        leadSummary: lead.summary,
    },
});
