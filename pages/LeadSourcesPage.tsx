import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, RefreshCw, Save, X } from 'lucide-react';
import { LeadSource, LeadSourceCheck, TargetRegion } from '../types';
import {
    listLeadSourceChecks,
    listLeadSources,
    recordLeadSourceCheck,
    saveLeadSource,
} from '../services/leadService';

const blankRegion = (): TargetRegion => ({
    id: crypto.randomUUID(),
    label: '',
    remotePreference: 'flexible',
});

const blankSource = (): LeadSource => ({
    id: crypto.randomUUID(),
    label: '',
    url: '',
    sourceType: 'company_careers',
    regions: [blankRegion()],
    notes: '',
});

const LeadSourcesPage: React.FC = () => {
    const [sources, setSources] = useState<LeadSource[]>([]);
    const [checks, setChecks] = useState<LeadSourceCheck[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [showCheckModal, setShowCheckModal] = useState(false);
    const [editingSource, setEditingSource] = useState<LeadSource>(blankSource());
    const [checkDraft, setCheckDraft] = useState({
        leadSourceId: '',
        status: 'succeeded' as LeadSourceCheck['status'],
        notes: '',
        discoveredCount: 0,
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const checksBySource = useMemo(() => {
        return checks.reduce<Record<string, LeadSourceCheck[]>>((acc, check) => {
            acc[check.leadSourceId] = [...(acc[check.leadSourceId] || []), check];
            return acc;
        }, {});
    }, [checks]);

    const loadData = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const [leadSources, leadChecks] = await Promise.all([
                listLeadSources(),
                listLeadSourceChecks(),
            ]);
            setSources(leadSources);
            setChecks(leadChecks);
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message || 'Failed to load lead sources.');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingSource(blankSource());
        setShowSourceModal(true);
    };

    const openEditModal = (source: LeadSource) => {
        setEditingSource({
            ...source,
            regions: source.regions.length ? source.regions : [blankRegion()],
        });
        setShowSourceModal(true);
    };

    const openCheckModal = (source: LeadSource) => {
        setCheckDraft({
            leadSourceId: source.id,
            status: 'succeeded',
            notes: '',
            discoveredCount: 0,
        });
        setShowCheckModal(true);
    };

    const handleSaveSource = async () => {
        setIsSaving(true);
        setErrorMessage('');
        try {
            const cleanedSource = {
                ...editingSource,
                regions: editingSource.regions.filter((region) => region.label.trim()),
            };
            const saved = await saveLeadSource(cleanedSource);
            setSources((prev) => {
                const exists = prev.some((source) => source.id === saved.id);
                return exists ? prev.map((source) => source.id === saved.id ? saved : source) : [saved, ...prev];
            });
            setShowSourceModal(false);
            setSuccessMessage('Lead source saved.');
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message || 'Failed to save lead source.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRecordCheck = async () => {
        setIsSaving(true);
        setErrorMessage('');
        try {
            const saved = await recordLeadSourceCheck(checkDraft);
            setChecks((prev) => [saved, ...prev]);
            setSources((prev) => prev.map((source) =>
                source.id === checkDraft.leadSourceId
                    ? { ...source, lastCheckedAt: saved.checkedAt }
                    : source
            ));
            setShowCheckModal(false);
            setSuccessMessage('Lead source check logged.');
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message || 'Failed to record lead source check.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6 min-w-0">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-center gap-4 min-w-0">
                <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">Lead Sources</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor private and local sources you want to review manually.</p>
                </div>
                <div className="flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center gap-3 w-full sm:w-auto">
                    <button onClick={loadData} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 inline-flex items-center justify-center gap-2">
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <button onClick={openCreateModal} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center justify-center gap-2">
                        <Plus size={16} />
                        Add Source
                    </button>
                </div>
            </div>

            {(errorMessage || successMessage) && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${errorMessage
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'
                    }`}>
                    {errorMessage || successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sources.map((source) => {
                    const sourceChecks = checksBySource[source.id] || [];
                    return (
                        <div key={source.id} className="min-w-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 space-y-4">
                            <div className="flex flex-col min-[420px]:flex-row min-[420px]:justify-between gap-3 min-w-0">
                                <div className="min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">{source.label}</h3>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-all">{source.url}</div>
                                </div>
                                <span className="w-fit shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 h-fit">
                                    {source.sourceType.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                <div><span className="font-medium text-gray-900 dark:text-white">Regions:</span> {source.regions.map((region) => `${region.label} (${region.remotePreference})`).join(', ') || 'None set'}</div>
                                <div><span className="font-medium text-gray-900 dark:text-white">Last checked:</span> {source.lastCheckedAt ? new Date(source.lastCheckedAt).toLocaleString() : 'Never'}</div>
                                {source.notes && <div className="mt-2"><span className="font-medium text-gray-900 dark:text-white">Notes:</span> {source.notes}</div>}
                            </div>
                            <div className="flex flex-col min-[360px]:flex-row gap-3">
                                <button onClick={() => openEditModal(source)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
                                    Edit
                                </button>
                                <button onClick={() => openCheckModal(source)} className="px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-700 text-white hover:bg-black dark:hover:bg-gray-600 text-sm">
                                    Log Check
                                </button>
                            </div>
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm mb-2">Recent checks</div>
                                {sourceChecks.length === 0 ? (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">No checks logged yet.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {sourceChecks.slice(0, 3).map((check) => (
                                            <div key={check.id} className="rounded-lg bg-gray-50 dark:bg-gray-950/50 px-3 py-2 text-sm">
                                                <div className="flex flex-col min-[420px]:flex-row min-[420px]:justify-between gap-1 min-w-0">
                                                    <span className="font-medium text-gray-900 dark:text-white">{check.status}</span>
                                                    <span className="text-gray-500 dark:text-gray-400 break-words">{new Date(check.checkedAt).toLocaleString()}</span>
                                                </div>
                                                <div className="text-gray-600 dark:text-gray-300">Discovered: {check.discoveredCount || 0}</div>
                                                {check.notes && <div className="text-gray-600 dark:text-gray-300 mt-1">{check.notes}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {sources.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
                    No lead sources yet. Add a company careers page, recruiter page, or local niche board to start tracking.
                </div>
            )}

            {showSourceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{sources.some((source) => source.id === editingSource.id) ? 'Edit Lead Source' : 'Add Lead Source'}</h3>
                            <button onClick={() => setShowSourceModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Label</label>
                                    <input value={editingSource.label} onChange={(e) => setEditingSource({ ...editingSource, label: e.target.value })} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Source Type</label>
                                    <select value={editingSource.sourceType} onChange={(e) => setEditingSource({ ...editingSource, sourceType: e.target.value as LeadSource['sourceType'] })} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent">
                                        <option value="company_careers">Company careers</option>
                                        <option value="niche_board">Niche board</option>
                                        <option value="recruiter">Recruiter</option>
                                        <option value="community">Community</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">URL</label>
                                <input value={editingSource.url} onChange={(e) => setEditingSource({ ...editingSource, url: e.target.value })} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Target Regions</label>
                                <div className="space-y-2">
                                    {editingSource.regions.map((region) => (
                                        <div key={region.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_180px_auto] gap-2">
                                            <input
                                                value={region.label}
                                                onChange={(e) => setEditingSource({
                                                    ...editingSource,
                                                    regions: editingSource.regions.map((item) => item.id === region.id ? { ...item, label: e.target.value } : item),
                                                })}
                                                className="min-w-0 border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent"
                                                placeholder="Boston metro"
                                            />
                                            <select
                                                value={region.remotePreference}
                                                onChange={(e) => setEditingSource({
                                                    ...editingSource,
                                                    regions: editingSource.regions.map((item) => item.id === region.id ? { ...item, remotePreference: e.target.value as TargetRegion['remotePreference'] } : item),
                                                })}
                                                className="border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent"
                                            >
                                                <option value="flexible">Flexible</option>
                                                <option value="remote">Remote</option>
                                                <option value="hybrid">Hybrid</option>
                                                <option value="onsite">Onsite</option>
                                            </select>
                                            <button
                                                onClick={() => setEditingSource({
                                                    ...editingSource,
                                                    regions: editingSource.regions.length > 1 ? editingSource.regions.filter((item) => item.id !== region.id) : editingSource.regions,
                                                })}
                                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setEditingSource({ ...editingSource, regions: [...editingSource.regions, blankRegion()] })} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                    + Add region
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea value={editingSource.notes || ''} onChange={(e) => setEditingSource({ ...editingSource, notes: e.target.value })} rows={4} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                            <button onClick={() => setShowSourceModal(false)} className="px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                                Cancel
                            </button>
                            <button onClick={handleSaveSource} disabled={isSaving || !editingSource.label.trim() || !editingSource.url.trim()} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Source
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCheckModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Log Lead Source Check</h3>
                            <button onClick={() => setShowCheckModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select value={checkDraft.status} onChange={(e) => setCheckDraft({ ...checkDraft, status: e.target.value as LeadSourceCheck['status'] })} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent">
                                    <option value="succeeded">Succeeded</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Discovered jobs</label>
                                <input type="number" min={0} value={checkDraft.discoveredCount} onChange={(e) => setCheckDraft({ ...checkDraft, discoveredCount: Number(e.target.value) })} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea value={checkDraft.notes} onChange={(e) => setCheckDraft({ ...checkDraft, notes: e.target.value })} rows={4} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-transparent" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                            <button onClick={() => setShowCheckModal(false)} className="px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                                Cancel
                            </button>
                            <button onClick={handleRecordCheck} disabled={isSaving} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Check
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadSourcesPage;
