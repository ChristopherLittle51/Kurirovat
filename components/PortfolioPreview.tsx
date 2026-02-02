import React from 'react';
import { TailoredApplication, UserProfile } from '../types';
import { TemplateId } from './templates';
import ModernMinimal from './templates/ModernMinimal';
import ProfessionalClassic from './templates/ProfessionalClassic';
import CreativeBold from './templates/CreativeBold';
import TechFocused from './templates/TechFocused';

interface Props {
  application: TailoredApplication;
  template?: TemplateId;
  onUpdate?: (updates: Partial<TailoredApplication>) => void;
}

/**
 * Web Portfolio Preview that uses the selected template.
 * Renders the application's resume using the template system for consistency.
 */
const PortfolioPreview: React.FC<Props> = ({ application, template = 'modern-minimal', onUpdate }) => {
  const { resume, slug } = application;

  // Render the selected template
  const renderTemplate = () => {
    const props = { data: resume, slug };
    switch (template) {
      case 'modern-minimal':
        return <ModernMinimal {...props} />;
      case 'professional-classic':
        return <ProfessionalClassic {...props} />;
      case 'creative-bold':
        return <CreativeBold {...props} />;
      case 'tech-focused':
        return <TechFocused {...props} />;
      default:
        return <ModernMinimal {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      {renderTemplate()}
    </div>
  );
};

export default PortfolioPreview;
