import React from 'react';
import { UserProfile } from '../types';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

interface Props {
  data: UserProfile;
}

const ResumeTemplate: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white p-8 md:p-12 shadow-2xl print:shadow-none print:p-0 text-gray-900 leading-relaxed" id="resume-preview">
      {/* Header */}
      <header className="border-b-2 border-gray-800 pb-6 mb-6">
        <h1 className="text-4xl font-serif font-bold uppercase tracking-wider mb-2">{data.fullName}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
          {data.email && (
            <div className="flex items-center gap-1">
              <Mail size={14} />
              <span>{data.email}</span>
            </div>
          )}
          {data.phone && (
            <div className="flex items-center gap-1">
              <Phone size={14} />
              <span>{data.phone}</span>
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{data.location}</span>
            </div>
          )}
          {data.links.map((link, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <Globe size={14} />
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{link.platform}</a>
            </div>
          ))}
        </div>
      </header>

      {/* Summary */}
      {data.summary && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Professional Summary</h2>
          <p className="text-gray-700 text-sm md:text-base">{data.summary}</p>
        </section>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Core Competencies</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium print:border print:border-gray-200">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Professional Experience</h2>
          <div className="space-y-5">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-lg">{exp.role}</h3>
                  <span className="text-sm text-gray-600 font-medium whitespace-nowrap">{exp.startDate} – {exp.endDate}</span>
                </div>
                <div className="text-md font-semibold text-gray-700 mb-2">{exp.company}</div>
                <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-gray-700">
                  {(exp.description || []).map((point, idx) => (
                    <li key={idx} className="pl-1">{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Education</h2>
          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-bold text-base">{edu.institution}</h3>
                  <div className="text-sm text-gray-700">{edu.degree}</div>
                </div>
                <span className="text-sm text-gray-600 font-medium">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ResumeTemplate;
