import { UserProfile, Experience, Education } from '../../types';

export interface TemplateMetadata {
    id: string;
    name: string;
    description: string;
    category: 'professional' | 'creative' | 'tech';
    thumbnail?: string;
}

export const TEMPLATES: TemplateMetadata[] = [
    {
        id: 'modern-minimal',
        name: 'Modern Minimal',
        description: 'Clean design with lots of whitespace and subtle accents',
        category: 'professional',
    },
    {
        id: 'professional-classic',
        name: 'Professional Classic',
        description: 'Traditional layout with serif headings and clear hierarchy',
        category: 'professional',
    },
    {
        id: 'creative-bold',
        name: 'Creative Bold',
        description: 'Eye-catching design with modern typography and accents',
        category: 'creative',
    },
    {
        id: 'tech-focused',
        name: 'Tech Focused',
        description: 'Developer-friendly layout with skills emphasis',
        category: 'tech',
    },
    {
        id: 'ats-optimized',
        name: 'ATS Optimized',
        description: 'Maximum parseability for automated screening systems',
        category: 'professional',
    },
];

export type TemplateId = typeof TEMPLATES[number]['id'];

export interface TemplateProps {
    data: UserProfile;
    slug?: string;
}

// Shared editable props interface for all templates
export interface EditableTemplateProps extends TemplateProps {
    editable?: boolean;
    onUpdate?: (field: keyof UserProfile, value: any) => void;
    onExperienceUpdate?: (expId: string, field: keyof Experience, value: any) => void;
    onEducationUpdate?: (eduId: string, field: keyof Education, value: any) => void;
    onAddExperience?: () => void;
    onRemoveExperience?: (expId: string) => void;
    onAddEducation?: () => void;
    onRemoveEducation?: (eduId: string) => void;
    onAddSkill?: (skill: string) => void;
    onRemoveSkill?: (index: number) => void;
    onBulletUpdate?: (expId: string, bulletIndex: number, value: string) => void;
    onAddBullet?: (expId: string) => void;
    onRemoveBullet?: (expId: string, bulletIndex: number) => void;
}

export { default as ModernMinimal } from './ModernMinimal';
export { default as ModernMinimalPDF } from './ModernMinimalPDF';
export { default as ProfessionalClassic } from './ProfessionalClassic';
export { default as ProfessionalClassicPDF } from './ProfessionalClassicPDF';
export { default as CreativeBold } from './CreativeBold';
export { default as CreativeBoldPDF } from './CreativeBoldPDF';
export { default as TechFocused } from './TechFocused';
export { default as TechFocusedPDF } from './TechFocusedPDF';
export { default as ATSOptimized } from './ATSOptimized';
export { default as ATSOptimizedPDF } from './ATSOptimizedPDF';
