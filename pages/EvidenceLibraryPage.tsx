import React, { useEffect, useMemo, useState } from 'react';
import { Archive, Plus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CandidateEvidence } from '../types';
import * as SupabaseService from '../services/supabaseService';

const emptyEvidence = (): CandidateEvidence => ({
    id: crypto.randomUUID(),
    title: '',
    situation: '',
    action: '',
    result: '',
    metric: '',
    scope: '',
    tools: [],
    teamSize: '',
    domain: '',
    tags: [],
    sourceType: 'manual',
    confidence: 'medium',
    roleIds: [],
    mustInclude: false,
    niceToUse: true,
    unavailable: false,
    disabled: false,
    roleFamilyConstraints: [],
});

const EvidenceLibraryPage: React.FC = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<CandidateEvidence[]>([]);
    const [editing, setEditing] = useState<CandidateEvidence | null>(null);
    const [mergeTargetId, setMergeTargetId] = useState('');
    const [message, setMessage] = useState('');

    const load = async () => {
        if (!user) return;
        try {
            setItems(await SupabaseService.getCandidateEvidence(user.id));
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Could not load evidence.');
        }
    };

    useEffect(() => {
        void load();
    }, [user]);

    const active = useMemo(() => items.filter((item) => !item.disabled), [items]);

    const save = async () => {
        if (!user || !editing || !editing.title.trim()) return;
        const saved = await SupabaseService.saveCandidateEvidence(user.id, editing);
        setItems((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
        setEditing(null);
        setMessage('Evidence saved.');
    };

    const disable = async (item: CandidateEvidence) => {
        if (!user) return;
        const saved = await SupabaseService.saveCandidateEvidence(user.id, { ...item, disabled: !item.disabled });
        setItems((current) => current.map((entry) => entry.id === saved.id ? saved : entry));
    };

    const merge = async () => {
        if (!user || !editing || !mergeTargetId || mergeTargetId === editing.id) return;
        const target = items.find((item) => item.id === mergeTargetId);
        if (!target) return;
        const merged: CandidateEvidence = {
            ...target,
            title: target.title || editing.title,
            situation: [target.situation, editing.situation].filter(Boolean).join(' '),
            action: [target.action, editing.action].filter(Boolean).join(' '),
            result: [target.result, editing.result].filter(Boolean).join(' '),
            metric: target.metric || editing.metric,
            scope: target.scope || editing.scope,
            tools: Array.from(new Set([...target.tools, ...editing.tools])),
            tags: Array.from(new Set([...target.tags, ...editing.tags])),
            roleIds: Array.from(new Set([...target.roleIds, ...editing.roleIds])),
        };
        await SupabaseService.mergeCandidateEvidence(user.id, merged, editing.id);
        setEditing(null);
        setMergeTargetId('');
        setMessage('Stories merged.');
        await load();
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Evidence library</h1>
                    <p className="mt-2 max-w-3xl text-gray-600 dark:text-gray-300">
                        Reusable STAR stories are the only source for resume claims. Add metrics only when you can support them.
                    </p>
                </div>
                <button onClick={() => setEditing(emptyEvidence())} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white">
                    <Plus size={18} /> Add story
                </button>
            </div>
            {message && <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">{message}</div>}

            {editing && (
                <section className="mt-6 rounded-2xl border border-blue-200 bg-white p-5 dark:border-blue-900 dark:bg-gray-900">
                    <div className="grid gap-4 md:grid-cols-2">
                        {([
                            ['title', 'Story title'],
                            ['situation', 'Situation / context'],
                            ['action', 'Your action'],
                            ['result', 'Result'],
                            ['metric', 'Supported metric'],
                            ['scope', 'Scale / stakeholders'],
                            ['teamSize', 'Team size'],
                            ['domain', 'Domain'],
                        ] as const).map(([field, label]) => (
                            <label key={field} className={field === 'situation' || field === 'action' || field === 'result' ? 'md:col-span-2' : ''}>
                                <span className="text-sm font-medium">{label}</span>
                                <textarea
                                    rows={field === 'situation' || field === 'action' || field === 'result' ? 2 : 1}
                                    value={editing[field]}
                                    onChange={(event) => setEditing({ ...editing, [field]: event.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
                                />
                            </label>
                        ))}
                        <label>
                            <span className="text-sm font-medium">Tools, comma separated</span>
                            <input value={editing.tools.join(', ')} onChange={(event) => setEditing({ ...editing, tools: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700" />
                        </label>
                        <label>
                            <span className="text-sm font-medium">Tags, comma separated</span>
                            <input value={editing.tags.join(', ')} onChange={(event) => setEditing({ ...editing, tags: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700" />
                        </label>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button onClick={() => void save()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white"><Save size={17} /> Save</button>
                        <button onClick={() => setEditing(null)} className="rounded-lg px-4 py-2">Cancel</button>
                        {items.some((item) => item.id !== editing.id) && (
                            <>
                                <select value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)} className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700">
                                    <option value="">Merge into…</option>
                                    {items.filter((item) => item.id !== editing.id).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                                </select>
                                <button disabled={!mergeTargetId} onClick={() => void merge()} className="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-40 dark:border-gray-700">Merge</button>
                            </>
                        )}
                    </div>
                </section>
            )}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {items.map((item) => (
                    <article key={item.id} className={`rounded-2xl border p-5 ${item.disabled ? 'border-gray-200 bg-gray-100 opacity-70 dark:border-gray-800 dark:bg-gray-900' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'}`}>
                        <div className="flex items-start justify-between gap-3">
                            <button onClick={() => setEditing(item)} className="text-left">
                                <h2 className="font-semibold">{item.title || 'Untitled story'}</h2>
                                <p className="mt-1 text-xs text-gray-500">Confidence: {item.confidence} · Used: {item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleDateString() : 'never'} · {item.usageHistory?.length || 0} run{item.usageHistory?.length === 1 ? '' : 's'}</p>
                            </button>
                            <div className="flex gap-1">
                                <button title={item.disabled ? 'Enable' : 'Disable'} onClick={() => void disable(item)} className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800"><Archive size={17} /></button>
                                <button title="Delete" onClick={() => user && void SupabaseService.deleteCandidateEvidence(user.id, item.id).then(load)} className="rounded p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={17} /></button>
                            </div>
                        </div>
                        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{item.action || item.situation || 'Add the action and situation for this story.'}</p>
                        {(item.metric || item.scope) && <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">{[item.metric, item.scope].filter(Boolean).join(' · ')}</p>}
                        <div className="mt-3 flex flex-wrap gap-1">{item.tags.map((tag) => <span key={tag} className="rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">{tag}</span>)}</div>
                    </article>
                ))}
            </div>
            {active.length === 0 && !editing && <p className="mt-10 text-center text-gray-500">No active evidence yet. Add a STAR story or answer a tailoring question.</p>}
        </div>
    );
};

export default EvidenceLibraryPage;
