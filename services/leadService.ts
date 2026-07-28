import { supabase } from './supabaseClient';
import {
    LeadSource,
    LeadSourceCheck,
} from '../types';
import {
    getLeadSourceChecks,
    getLeadSources,
    recordLeadSourceCheck as recordLeadSourceCheckInDb,
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
