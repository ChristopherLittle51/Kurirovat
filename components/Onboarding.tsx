import React, { useState, useEffect } from 'react';
import { UserProfile, Experience, Education } from '../types';
import { Plus, Trash2, ChevronRight, Check, UploadCloud, Loader2, FileText, Save } from 'lucide-react';
import { parseResumeFromPdf } from '../services/geminiService';

interface Props {
  onComplete: (profile: UserProfile) => void;
  initialData?: UserProfile | null;
}

const Onboarding: React.FC<Props> = ({ onComplete, initialData }) => {
  const [step, setStep] = useState(initialData ? 1 : 0); // 0 is upload, 1-4 are review/edit
  const [isUploading, setIsUploading] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    links: [],
    githubUsername: ''
  });

  useEffect(() => {
    if (initialData) {
      setProfile(initialData);
    }
  }, [initialData]);

  const [tempSkill, setTempSkill] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const extractedData = await parseResumeFromPdf(base64String);
          setProfile(extractedData);
          setStep(1); // Move to review step
        } catch (error) {
          console.error(error);
          alert("Failed to parse PDF. Please try again or enter details manually.");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      alert("Error reading file.");
    }
  };

  const addExperience = () => {
    setProfile(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: Date.now().toString(),
          company: '',
          role: '',
          startDate: '',
          endDate: '',
          description: ['']
        }
      ]
    }));
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const newExp = [...profile.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setProfile(prev => ({ ...prev, experience: newExp }));
  };

  const updateExperienceBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const newExp = [...profile.experience];
    const newDesc = [...newExp[expIndex].description];
    newDesc[bulletIndex] = value;
    newExp[expIndex].description = newDesc;
    setProfile(prev => ({ ...prev, experience: newExp }));
  }

  const addBullet = (expIndex: number) => {
    const newExp = [...profile.experience];
    newExp[expIndex].description.push('');
    setProfile(prev => ({ ...prev, experience: newExp }));
  }

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const newExp = [...profile.experience];
    newExp[expIndex].description.splice(bulletIndex, 1);
    setProfile(prev => ({ ...prev, experience: newExp }));
  }

  const addEducation = () => {
    setProfile(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now().toString(), institution: '', degree: '', year: '' }]
    }));
  }

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const newEdu = [...profile.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setProfile(prev => ({ ...prev, education: newEdu }));
  }

  const addSkill = () => {
    if (tempSkill.trim()) {
      setProfile(prev => ({ ...prev, skills: [...prev.skills, tempSkill.trim()] }));
      setTempSkill('');
    }
  };

  // Helper to safely render steps
  const renderStepIndicator = () => (
    <div className="flex gap-2 mt-4">
      {[1, 2, 3, 4].map(s => (
        <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-900">
          {initialData ? "Edit Profile" : (step === 0 ? "Upload Your Resume" : "Review & Edit Profile")}
        </h1>
        <p className="text-gray-600 mt-2">
          {step === 0 && !initialData
            ? "Upload your current PDF resume. Gemini will extract your details automatically."
            : "Review and update your profile details."}
        </p>
        {step > 0 && renderStepIndicator()}
      </div>

      {step === 0 && (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors cursor-pointer relative">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="flex flex-col items-center animate-pulse">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-700">Analyzing PDF with Gemini...</p>
              <p className="text-sm text-gray-500">This may take a few seconds.</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Click to Upload Resume</h3>
              <p className="text-gray-500 max-w-xs mx-auto mb-6">Supported Format: PDF. We use AI to parse your text, so standard formatting works best.</p>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-400 hover:text-gray-600 underline z-10 relative"
              >
                Skip upload and start manually
              </button>
            </>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 border border-blue-100">
            <FileText className="text-blue-600 mt-1 shrink-0" size={20} />
            <div>
              <h4 className="font-semibold text-blue-900">Contact Details</h4>
              <p className="text-sm text-blue-700">Ensure your contact info is up to date.</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold">Contact Details</h2>
          <input className="w-full border p-3 rounded" placeholder="Full Name" value={profile.fullName} onChange={e => setProfile({ ...profile, fullName: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input className="border p-3 rounded" placeholder="Email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
            <input className="border p-3 rounded" placeholder="Phone" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <input className="w-full border p-3 rounded" placeholder="GitHub Username (e.g. 'octocat')" value={profile.githubUsername || ''} onChange={e => setProfile({ ...profile, githubUsername: e.target.value })} />
          <input className="w-full border p-3 rounded" placeholder="City, State" value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} />
          <textarea className="w-full border p-3 rounded h-32" placeholder="Professional Summary (General)" value={profile.summary} onChange={e => setProfile({ ...profile, summary: e.target.value })} />

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Social Links</h3>
            {profile.links.map((link, idx) => (
              <div key={idx} className="flex gap-2">
                <input className="flex-1 border p-2 rounded" value={link.platform} onChange={(e) => {
                  const newLinks = [...profile.links];
                  newLinks[idx].platform = e.target.value;
                  setProfile({ ...profile, links: newLinks });
                }} placeholder="Platform (e.g. LinkedIn)" />
                <input className="flex-[2] border p-2 rounded" value={link.url} onChange={(e) => {
                  const newLinks = [...profile.links];
                  newLinks[idx].url = e.target.value;
                  setProfile({ ...profile, links: newLinks });
                }} placeholder="URL" />
                <button onClick={() => setProfile({ ...profile, links: profile.links.filter((_, i) => i !== idx) })} className="text-red-500"><Trash2 size={16} /></button>
              </div>
            ))}
            <button onClick={() => setProfile({ ...profile, links: [...profile.links, { platform: '', url: '' }] })} className="text-sm text-blue-600 font-medium">+ Add Link</button>
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={() => setStep(2)} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">Next: Experience <ChevronRight size={18} /></button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-semibold">Experience</h2>
          {profile.experience.map((exp, idx) => (
            <div key={exp.id} className="border p-4 rounded-lg bg-gray-50 relative">
              <button onClick={() => {
                const newExp = profile.experience.filter((_, i) => i !== idx);
                setProfile({ ...profile, experience: newExp });
              }} className="absolute top-2 right-2 text-red-500"><Trash2 size={16} /></button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <input className="border p-2 rounded" placeholder="Company" value={exp.company} onChange={e => updateExperience(idx, 'company', e.target.value)} />
                <input className="border p-2 rounded" placeholder="Role" value={exp.role} onChange={e => updateExperience(idx, 'role', e.target.value)} />
                <input className="border p-2 rounded" placeholder="Start Date" value={exp.startDate} onChange={e => updateExperience(idx, 'startDate', e.target.value)} />
                <input className="border p-2 rounded" placeholder="End Date" value={exp.endDate} onChange={e => updateExperience(idx, 'endDate', e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Achievements (Bullet Points)</label>
                {exp.description.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex gap-2">
                    <input className="flex-1 border p-2 rounded text-sm" value={bullet} onChange={(e) => updateExperienceBullet(idx, bIdx, e.target.value)} placeholder="• Led a team of..." />
                    <button onClick={() => removeBullet(idx, bIdx)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={() => addBullet(idx)} className="text-blue-600 text-sm font-medium hover:underline">+ Add Bullet</button>
              </div>
            </div>
          ))}
          <button onClick={addExperience} className="w-full border-2 border-dashed border-gray-300 p-3 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex justify-center items-center gap-2">
            <Plus size={18} /> Add Position
          </button>
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-gray-600 px-6 py-2">Back</button>
            <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">Next: Education <ChevronRight size={18} /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-semibold">Education</h2>
          {profile.education.map((edu, idx) => (
            <div key={edu.id} className="border p-4 rounded-lg bg-gray-50 relative">
              <button onClick={() => {
                const newEdu = profile.education.filter((_, i) => i !== idx);
                setProfile({ ...profile, education: newEdu });
              }} className="absolute top-2 right-2 text-red-500"><Trash2 size={16} /></button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input className="border p-2 rounded" placeholder="Institution" value={edu.institution} onChange={e => updateEducation(idx, 'institution', e.target.value)} />
                <input className="border p-2 rounded" placeholder="Degree" value={edu.degree} onChange={e => updateEducation(idx, 'degree', e.target.value)} />
                <input className="border p-2 rounded" placeholder="Year" value={edu.year} onChange={e => updateEducation(idx, 'year', e.target.value)} />
              </div>
            </div>
          ))}
          <button onClick={addEducation} className="w-full border-2 border-dashed border-gray-300 p-3 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex justify-center items-center gap-2">
            <Plus size={18} /> Add Education
          </button>
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="text-gray-600 px-6 py-2">Back</button>
            <button onClick={() => setStep(4)} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">Next: Skills <ChevronRight size={18} /></button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-semibold">Skills</h2>
          <div className="flex gap-2">
            <input
              className="flex-1 border p-3 rounded"
              placeholder="e.g. React, Project Management, Python"
              value={tempSkill}
              onChange={e => setTempSkill(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSkill()}
            />
            <button onClick={addSkill} className="bg-gray-900 text-white px-4 rounded">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, i) => (
              <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {skill}
                <button onClick={() => setProfile(prev => ({ ...prev, skills: prev.skills.filter((_, idx) => idx !== i) }))} className="text-gray-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
          <div className="flex justify-between pt-8">
            <button onClick={() => setStep(3)} className="text-gray-600 px-6 py-2">Back</button>
            <button onClick={() => onComplete(profile)} className="bg-green-600 text-white px-8 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-lg shadow-green-200">
              {initialData ? "Save Changes" : "Finish Setup"} {initialData ? <Save size={18} /> : <Check size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
