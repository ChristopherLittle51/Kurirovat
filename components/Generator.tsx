import React, { useMemo, useState } from 'react';
import { Sparkles, ArrowRight, Loader2, ScanSearch, Save } from 'lucide-react';
import {
  GithubProject,
  JobAnalysis,
  JobDescription,
  TailoringOptions,
  TailoringPlaybook,
} from '../types';
import { analyzeJobDescription } from '../services/geminiService';

interface Props {
  onGenerate: (jd: JobDescription, projects: GithubProject[], showScore: boolean, options?: TailoringOptions) => void;
  onSavePlaybook?: (name: string, options: TailoringOptions) => void;
  isLoading: boolean;
  availableGithubProjects?: GithubProject[];
  availablePlaybooks?: TailoringPlaybook[];
}

const roleFamilyOptions = ['engineering', 'product', 'design', 'marketing', 'operations', 'sales', 'general'];

const defaultWeights = {
  leadership: 0.5,
  technicalDepth: 0.5,
  measurableImpact: 0.7,
  recency: 0.7,
  domainMatch: 0.6,
};

const splitLines = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const joinLines = (items?: string[]) => (items || []).join('\n');

const Generator: React.FC<Props> = ({
  onGenerate,
  onSavePlaybook,
  isLoading,
  availableGithubProjects = [],
  availablePlaybooks = [],
}) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [showMatchScore, setShowMatchScore] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [isAnalyzingJD, setIsAnalyzingJD] = useState(false);

  const [tone, setTone] = useState('professional');
  const [conciseness, setConciseness] = useState('standard');
  const [focusSkill, setFocusSkill] = useState('');
  const [strategyPreset, setStrategyPreset] = useState<'ATS' | 'Balanced' | 'Recruiter'>('Balanced');
  const [careerMode, setCareerMode] = useState<'Standard' | 'Transferable Skills'>('Standard');
  const [critiqueMode, setCritiqueMode] = useState<'Blunt' | 'Supportive'>('Blunt');
  const [selectedPlaybookId, setSelectedPlaybookId] = useState('');
  const [promptPreviewOverride, setPromptPreviewOverride] = useState('');
  const [antiClaims, setAntiClaims] = useState('');
  const [preferredRoleFamilies, setPreferredRoleFamilies] = useState<string[]>([]);
  const [weights, setWeights] = useState(defaultWeights);
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [regenerationInstructions, setRegenerationInstructions] = useState('');

  const promptPreview = useMemo(() => {
    return [
      `Preset: ${strategyPreset}`,
      `Career mode: ${careerMode}`,
      `Critique: ${critiqueMode}`,
      `Tone: ${tone}`,
      `Conciseness: ${conciseness}`,
      `Focus skill: ${focusSkill || 'None'}`,
      `Role families: ${preferredRoleFamilies.join(', ') || 'None'}`,
      `Anti-claims: ${antiClaims || 'None'}`,
      `Weights: leadership=${weights.leadership.toFixed(2)}, technical=${weights.technicalDepth.toFixed(2)}, impact=${weights.measurableImpact.toFixed(2)}, recency=${weights.recency.toFixed(2)}, domain=${weights.domainMatch.toFixed(2)}`,
      jobAnalysis ? `JD keywords: ${jobAnalysis.keywords.join(', ')}` : 'JD keywords: analyze to preview',
      promptPreviewOverride ? `Prompt adjustment: ${promptPreviewOverride}` : 'Prompt adjustment: none',
      regenerationInstructions ? `Generation notes: ${regenerationInstructions}` : 'Generation notes: none',
    ].join('\n');
  }, [
    antiClaims,
    careerMode,
    conciseness,
    critiqueMode,
    focusSkill,
    jobAnalysis,
    preferredRoleFamilies,
    promptPreviewOverride,
    regenerationInstructions,
    strategyPreset,
    tone,
    weights,
  ]);

  const handleAnalyze = async () => {
    if (!company || !role || !description) return;
    setIsAnalyzingJD(true);
    try {
      const analysis = await analyzeJobDescription({
        companyName: company,
        roleTitle: role,
        rawText: description,
      });
      setJobAnalysis(analysis);
      if (analysis.roleFamily && !preferredRoleFamilies.length) {
        setPreferredRoleFamilies([analysis.roleFamily]);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to analyze job description.');
    } finally {
      setIsAnalyzingJD(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company && role && description) {
      const projects = availableGithubProjects.filter((p) => selectedProjects.includes(p.id));
      onGenerate(
        {
          companyName: company,
          roleTitle: role,
          rawText: description,
        },
        projects,
        showMatchScore,
        {
          tone,
          conciseness,
          focusSkill,
          strategyPreset,
          careerMode,
          critiqueMode,
          preferredRoleFamilies,
          antiClaims: splitLines(antiClaims),
          promptPreviewOverride,
          regenerationInstructions,
          selectedPlaybookId: selectedPlaybookId || undefined,
          jobAnalysisOverride: jobAnalysis || undefined,
          weights,
        },
      );
    }
  };

  const toggleProject = (id: number) => {
    if (selectedProjects.includes(id)) {
      setSelectedProjects((prev) => prev.filter((p) => p !== id));
      return;
    }
    if (selectedProjects.length >= 3) {
      alert('You can select up to 3 projects.');
      return;
    }
    setSelectedProjects((prev) => [...prev, id]);
  };

  const applyPlaybook = (playbookId: string) => {
    setSelectedPlaybookId(playbookId);
    const playbook = availablePlaybooks.find((item) => item.id === playbookId);
    if (!playbook) return;
    setStrategyPreset(playbook.strategyPreset as 'ATS' | 'Balanced' | 'Recruiter');
    setTone(playbook.tone || 'professional');
    setConciseness(playbook.conciseness || 'standard');
    setFocusSkill(playbook.focusSkill || '');
    setCritiqueMode((playbook.critiqueMode as 'Blunt' | 'Supportive') || 'Blunt');
    setPreferredRoleFamilies(playbook.preferredRoleFamilies || []);
    setAntiClaims((playbook.antiClaims || []).join('\n'));
    setPromptPreviewOverride(playbook.promptOverrides || '');
    if (playbook.weights) {
      setWeights({
        leadership: playbook.weights.leadership,
        technicalDepth: playbook.weights.technicalDepth,
        measurableImpact: playbook.weights.measurableImpact,
        recency: playbook.weights.recency,
        domainMatch: playbook.weights.domainMatch,
      });
    }
  };

  const saveCurrentPlaybook = () => {
    if (!onSavePlaybook) return;
    const name = window.prompt('Playbook name');
    if (!name?.trim()) return;
    onSavePlaybook(name.trim(), {
      tone,
      conciseness,
      focusSkill,
      strategyPreset,
      careerMode,
      critiqueMode,
      preferredRoleFamilies,
      antiClaims: splitLines(antiClaims),
      promptPreviewOverride,
      weights,
    });
  };

  const updateArrayField = (field: keyof JobAnalysis, value: string) => {
    if (!jobAnalysis) return;
    setJobAnalysis({
      ...jobAnalysis,
      [field]: splitLines(value),
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="text-blue-600 dark:text-blue-400" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Application</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Tailor a grounded resume and cover letter with editable strategy, JD analysis, and critique.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
            <input
              required
              className="w-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-900 text-gray-900 dark:text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="e.g. Google"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Title</label>
            <input
              required
              className="w-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-900 text-gray-900 dark:text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="e.g. Senior Frontend Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Description</label>
          <textarea
            required
            className="w-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg h-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
            placeholder="Paste the full job description here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzingJD || !company || !role || !description}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {isAnalyzingJD ? <Loader2 className="animate-spin" size={16} /> : <ScanSearch size={16} />}
            {isAnalyzingJD ? 'Analyzing JD...' : 'Analyze Job Description'}
          </button>

          {availablePlaybooks.length > 0 && (
            <select
              value={selectedPlaybookId}
              onChange={(e) => applyPlaybook(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
            >
              <option value="">Apply saved playbook</option>
              {availablePlaybooks.map((playbook) => (
                <option key={playbook.id} value={playbook.id}>
                  {playbook.name}
                </option>
              ))}
            </select>
          )}

          {onSavePlaybook && (
            <button
              type="button"
              onClick={saveCurrentPlaybook}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <Save size={16} />
              Save Playbook
            </button>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Tailoring Controls</h3>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
            </button>
          </div>

          {showAdvanced && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-6 space-y-5 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Preset</label>
                  <select value={strategyPreset} onChange={(e) => setStrategyPreset(e.target.value as any)} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg">
                    <option value="ATS">ATS</option>
                    <option value="Balanced">Balanced</option>
                    <option value="Recruiter">Recruiter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Career Mode</label>
                  <select value={careerMode} onChange={(e) => setCareerMode(e.target.value as any)} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg">
                    <option value="Standard">Standard</option>
                    <option value="Transferable Skills">Transferable Skills</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Critique Mode</label>
                  <select value={critiqueMode} onChange={(e) => setCritiqueMode(e.target.value as any)} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg">
                    <option value="Blunt">Blunt</option>
                    <option value="Supportive">Supportive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Writing Tone</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg">
                    <option value="professional">Professional</option>
                    <option value="technical">Technical</option>
                    <option value="executive">Executive</option>
                    <option value="warm">Warm</option>
                    <option value="assertive">Assertive</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Conciseness</label>
                  <select value={conciseness} onChange={(e) => setConciseness(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg">
                    <option value="standard">Standard</option>
                    <option value="concise">Concise</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Focus Skill</label>
                  <input
                    value={focusSkill}
                    onChange={(e) => setFocusSkill(e.target.value)}
                    placeholder="e.g. React, Python, Leadership"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preferred Role Families</label>
                  <div className="flex flex-wrap gap-2">
                    {roleFamilyOptions.map((family) => {
                      const selected = preferredRoleFamilies.includes(family);
                      return (
                        <button
                          key={family}
                          type="button"
                          onClick={() =>
                            setPreferredRoleFamilies((prev) =>
                              selected ? prev.filter((item) => item !== family) : [...prev, family]
                            )
                          }
                          className={`px-3 py-1 rounded-full text-sm border ${
                            selected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {family}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['leadership', 'Leadership weight'],
                  ['technicalDepth', 'Technical depth weight'],
                  ['measurableImpact', 'Impact weight'],
                  ['recency', 'Recency weight'],
                  ['domainMatch', 'Domain match weight'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1">
                      {label} <span className="text-xs text-gray-500">{weights[key as keyof typeof weights].toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={weights[key as keyof typeof weights]}
                      onChange={(e) =>
                        setWeights((prev) => ({
                          ...prev,
                          [key]: Number(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Anti-Claims / Do Not Invent</label>
                  <textarea
                    value={antiClaims}
                    onChange={(e) => setAntiClaims(e.target.value)}
                    rows={5}
                    placeholder={'Do not imply people management\nDo not claim direct fintech experience'}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prompt Preview Adjustments</label>
                  <textarea
                    value={promptPreviewOverride}
                    onChange={(e) => setPromptPreviewOverride(e.target.value)}
                    rows={5}
                    placeholder="Optional extra guardrails or emphasis."
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Generation Notes</label>
                <textarea
                  value={regenerationInstructions}
                  onChange={(e) => setRegenerationInstructions(e.target.value)}
                  rows={3}
                  placeholder="Optional notes such as: emphasize platform migration work and avoid sounding too senior."
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-3 rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {jobAnalysis && (
            <div className="mb-6 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">Editable Job Analysis</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Seniority</label>
                  <input value={jobAnalysis.seniority} onChange={(e) => setJobAnalysis({ ...jobAnalysis, seniority: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Domain</label>
                  <input value={jobAnalysis.domain} onChange={(e) => setJobAnalysis({ ...jobAnalysis, domain: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Role Family</label>
                  <select value={jobAnalysis.roleFamily} onChange={(e) => setJobAnalysis({ ...jobAnalysis, roleFamily: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg">
                    {roleFamilyOptions.map((family) => <option key={family} value={family}>{family}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Must-have Terms</label>
                  <textarea value={joinLines(jobAnalysis.mustHaveTerms)} onChange={(e) => updateArrayField('mustHaveTerms', e.target.value)} rows={4} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Keywords</label>
                  <textarea value={joinLines(jobAnalysis.keywords)} onChange={(e) => updateArrayField('keywords', e.target.value)} rows={5} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Requirements</label>
                  <textarea value={joinLines(jobAnalysis.requirements)} onChange={(e) => updateArrayField('requirements', e.target.value)} rows={5} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Responsibilities</label>
                  <textarea value={joinLines(jobAnalysis.responsibilities)} onChange={(e) => updateArrayField('responsibilities', e.target.value)} rows={5} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pain Points</label>
                  <textarea value={joinLines(jobAnalysis.painPoints)} onChange={(e) => updateArrayField('painPoints', e.target.value)} rows={5} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Signals To Avoid</label>
                  <textarea value={joinLines(jobAnalysis.signalsToAvoid)} onChange={(e) => updateArrayField('signalsToAvoid', e.target.value)} rows={5} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nice-to-have Terms</label>
                  <textarea value={joinLines(jobAnalysis.niceToHaveTerms)} onChange={(e) => updateArrayField('niceToHaveTerms', e.target.value)} rows={5} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-2 rounded-lg text-sm" />
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prompt Preview</label>
            <textarea
              readOnly
              value={promptPreview}
              rows={8}
              className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-3 rounded-lg font-mono text-xs"
            />
          </div>

          {availableGithubProjects.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Featured GitHub Projects (Max 3)</label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                {availableGithubProjects.map((repo) => (
                  <div
                    key={repo.id}
                    onClick={() => toggleProject(repo.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedProjects.includes(repo.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                  >
                    <div className="overflow-hidden">
                      <div className={`font-bold truncate ${selectedProjects.includes(repo.id) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>{repo.name}</div>
                      <div className={`text-xs truncate ${selectedProjects.includes(repo.id) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>{repo.description || 'No description'}</div>
                    </div>
                    {selectedProjects.includes(repo.id) && <div className="text-blue-600 dark:text-blue-400">✓</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showScore"
              checked={showMatchScore}
              onChange={(e) => setShowMatchScore(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
            <label htmlFor="showScore" className="text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer">
              Show "Role Fit Estimate" gauge on public portfolio?
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold text-white transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-xl'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" /> Analyzing & Generating...
            </>
          ) : (
            <>
              Generate Tailored Resume <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Generator;
