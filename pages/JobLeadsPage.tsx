import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Filter, Loader2, Plus, Save } from 'lucide-react';
import { JobLead, LeadSource } from '../types';
import { listJobLeads, listLeadSources, saveJobLead, convertLeadToApplication } from '../services/leadService';
import { useNavigate } from 'react-router-dom';

const blankLead = (): JobLead => ({
    id: crypto.randomUUID(),
    leadSourceId: '',
    title: '',
    companyName: '',
    location: '',
    url: '',
    summary: '',
    rawDescription: '',
    provenance: {
        discoveredAt: new Date().toISOString(),
        submittedBy: 'user',
        notes: '',
    },
    regions: [],
    status: 'new',
});

const JobLeadsPage: React.FC = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<JobLead[]>([]);
    const [sources, setSources] = useState<LeadSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [draftLead, setDraftLead] = useState<JobLead>(blankLead());
    const [selectedLeadId, setSelectedLeadId] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | JobLead['status']>('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [regionFilter, setRegionFilter] = useState('all');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const [leadItems, sourceItems] = await Promise.all([
                listJobLeads(),
                listLeadSources(),
            ]);
            setLeads(leadItems);
            setSources(sourceItems);
            if (leadItems.length) {
                setSelectedLeadId((current) => current || leadItems[0].id);
            }
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message || 'Failed to load job leads.');
        } finally {
            setLoading(false);
        }
    };

    const availableRegions = useMemo(() => {
        return Array.from(new Set(leads.flatMap((lead) => lead.regions.map((region) => region.label)).filter(Boolean)));
    }, [leads]);

    const filteredLeads = useMemo(() => {
        return leads.filter((lead) => {
            if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
            if (sourceFilter !== 'all' && lead.leadSourceId !== sourceFilter) return false;
            if (regionFilter !== 'all' && !lead.regions.some((region) => region.label === regionFilter)) return false;
            return true;
        });
    }, [leads, regionFilter, sourceFilter, statusFilter]);

    const selectedLead = filteredLeads.find((lead) => lead.id === selectedLeadId) || filteredLeads[0] || null;

    const updateLeadStatus = async (lead: JobLead, status: JobLead['status']) => {
        setIsSaving(true);
        setErrorMessage('');
        try {
            const saved = await saveJobLead({ ...lead, status });
            setLeads((prev) => prev.map((item) => item.id === saved.id ? { ...saved, leadSourceLabel: lead.leadSourceLabel } : item));
            setSuccessMessage(`Lead marked as ${status}.`);
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message || 'Failed to update lead status.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateLead = async () => {
        setIsSaving(true);
        setErrorMessage('');
        try {
            const selectedSource = sources.find((source) => source.id === draftLead.leadSourceId);
            const saved = await saveJobLead({
                ...draftLead,
                leadSourceLabel: selectedSource?.label,
            });
            setLeads((prev) => [{ ...saved, leadSourceLabel: selectedSource?.label }, ...prev]);
            setDraftLead(blankLead());
            setShowCreateForm(false);
            setSuccessMessage('Job lead saved.');
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message || 'Failed to save job lead.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConvert = async (lead: JobLead) => {
        setIsSaving(true);
        setErrorMessage('');
        try {
            const saved = await saveJobLead({ ...lead, status: 'saved' });
            setLeads((prev) => prev.map((item) => item.id === lead.id ? { ...saved, leadSourceLabel: lead.leadSourceLabel } : item));
            navigate('/admin/new', {
                state: convertLeadToApplication({
                    ...lead,
                    status: 'saved',
                }),
            });
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message || 'Failed to convert lead to application.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6 min-w-0">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-4 min-w-0">
                <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">Job Leads</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review discovered jobs, mark disposition, and convert promising leads into new application drafts.</p>
                </div>
                <button onClick={() => setShowCreateForm((prev) => !prev)} className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center justify-center gap-2">
                    <Plus size={16} />
                    {showCreateForm ? 'Close Form' : 'Add Lead'}
                </button>
            </div>

            {(errorMessage || successMessage) && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${errorMessage
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
                    }`}>
                    {errorMessage || successMessage}
                </div>
            )}

            {showCreateForm && (
                <div className="min-w-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Job Lead</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input value={draftLead.companyName} onChange={(e) => setDraftLead({ ...draftLead, companyName: e.target.value })} placeholder="Company" className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent" />
                        <input value={draftLead.title} onChange={(e) => setDraftLead({ ...draftLead, title: e.target.value })} placeholder="Role title" className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent" />
                        <input value={draftLead.location} onChange={(e) => setDraftLead({ ...draftLead, location: e.target.value })} placeholder="Location" className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent" />
                        <select value={draftLead.leadSourceId} onChange={(e) => setDraftLead({ ...draftLead, leadSourceId: e.target.value })} className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent">
                            <option value="">Choose source</option>
                            {sources.map((source) => (
                                <option key={source.id} value={source.id}>{source.label}</option>
                            ))}
                        </select>
                    </div>
                    <input value={draftLead.url} onChange={(e) => setDraftLead({ ...draftLead, url: e.target.value })} placeholder="Posting URL" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent" />
                    <textarea value={draftLead.summary} onChange={(e) => setDraftLead({ ...draftLead, summary: e.target.value })} rows={3} placeholder="Short summary" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent" />
                    <textarea value={draftLead.rawDescription} onChange={(e) => setDraftLead({ ...draftLead, rawDescription: e.target.value })} rows={6} placeholder="Full raw job description" className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent font-mono text-sm" />
                    <div className="flex justify-end">
                        <button onClick={handleCreateLead} disabled={isSaving || !draftLead.companyName.trim() || !draftLead.title.trim() || !draftLead.url.trim()} className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Lead
                        </button>
                    </div>
                </div>
            )}

            <div className="min-w-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Filter size={16} />
                        Filters
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="min-w-0 max-w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm">
                        <option value="all">All statuses</option>
                        <option value="new">New</option>
                        <option value="saved">Saved</option>
                        <option value="dismissed">Dismissed</option>
                    </select>
                    <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="min-w-0 max-w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm">
                        <option value="all">All sources</option>
                        {sources.map((source) => (
                            <option key={source.id} value={source.id}>{source.label}</option>
                        ))}
                    </select>
                    <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="min-w-0 max-w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-transparent text-sm">
                        <option value="all">All regions</option>
                        {availableRegions.map((region) => (
                            <option key={region} value={region}>{region}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-6">
                <div className="min-w-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredLeads.map((lead) => (
                            <button
                                key={lead.id}
                                onClick={() => setSelectedLeadId(lead.id)}
                                className={`w-full min-w-0 text-left px-4 sm:px-5 py-4 transition ${selectedLead?.id === lead.id
                                    ? 'bg-blue-50 dark:bg-blue-950/30'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                                    }`}
                            >
                                <div className="flex justify-between gap-3 min-w-0">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 dark:text-white truncate">{lead.companyName}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300 break-words">{lead.title}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">{lead.location}</div>
                                    </div>
                                    <span className={`shrink-0 h-fit text-xs font-semibold px-2 py-1 rounded-full ${
                                        lead.status === 'saved'
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                                            : lead.status === 'dismissed'
                                                ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                    }`}>
                                        {lead.status || 'new'}
                                    </span>
                                </div>
                                {lead.leadSourceLabel && <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Source: {lead.leadSourceLabel}</div>}
                            </button>
                        ))}
                    </div>
                    {filteredLeads.length === 0 && (
                        <div className="p-6 text-sm text-gray-500 dark:text-gray-400">No job leads match the current filters.</div>
                    )}
                </div>

                <div className="min-w-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6">
                    {selectedLead ? (
                        <div className="space-y-5">
                            <div className="flex flex-col lg:flex-row lg:flex-wrap lg:justify-between gap-4 min-w-0">
                                <div className="min-w-0">
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{selectedLead.title}</h3>
                                    <div className="text-gray-600 dark:text-gray-300 mt-1 break-words">{selectedLead.companyName}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-words">{selectedLead.location}</div>
                                </div>
                                <div className="flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center gap-3">
                                    <a href={selectedLead.url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center justify-center gap-2 text-sm">
                                        <ExternalLink size={16} />
                                        Open posting
                                    </a>
                                    <button onClick={() => handleConvert(selectedLead)} disabled={isSaving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 text-sm">
                                        Convert to Application
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">Source</div>
                                    <div className="mt-2 text-gray-600 dark:text-gray-300">{selectedLead.leadSourceLabel || 'Direct/manual lead'}</div>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">Provenance</div>
                                    <div className="mt-2 text-gray-600 dark:text-gray-300">
                                        <div>Discovered: {selectedLead.provenance.discoveredAt ? new Date(selectedLead.provenance.discoveredAt).toLocaleString() : 'Unknown'}</div>
                                        <div>Submitted by: {selectedLead.provenance.submittedBy}</div>
                                        {selectedLead.provenance.notes && <div>Notes: {selectedLead.provenance.notes}</div>}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">Regions</div>
                                    <div className="mt-2 text-gray-600 dark:text-gray-300">
                                        {selectedLead.regions.map((region) => `${region.label} (${region.remotePreference})`).join(', ') || 'None'}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">Disposition</div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <button onClick={() => updateLeadStatus(selectedLead, 'saved')} disabled={isSaving} className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                                            Save
                                        </button>
                                        <button onClick={() => updateLeadStatus(selectedLead, 'dismissed')} disabled={isSaving} className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 dark:border-red-900/50 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30">
                                            Dismiss
                                        </button>
                                        <button onClick={() => updateLeadStatus(selectedLead, 'new')} disabled={isSaving} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">Summary</div>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedLead.summary || 'No summary saved.'}</p>
                            </div>

                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">Raw Description</div>
                                <textarea
                                    readOnly
                                    value={selectedLead.rawDescription || ''}
                                    rows={14}
                                    className="mt-2 w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-950 p-3 text-sm font-mono"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">Select a job lead to inspect it.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobLeadsPage;
