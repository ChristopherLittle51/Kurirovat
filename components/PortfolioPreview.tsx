import React from 'react';
import { TailoredApplication, UserProfile } from '../types';
import { TemplateId } from './templates';
import ModernMinimal from './templates/ModernMinimal';
import ProfessionalClassic from './templates/ProfessionalClassic';
import CreativeBold from './templates/CreativeBold';
import TechFocused from './templates/TechFocused';

import { WEB_THEMES, WebThemeId } from './portfolio/web-themes';

interface Props {
  application: TailoredApplication;
  template?: TemplateId;
  theme?: WebThemeId;
  type?: 'resume' | 'web';
  onUpdate?: (updates: Partial<TailoredApplication>) => void;
  onDownloadResume?: () => void;
}

/**
 * Web Portfolio Preview that uses the selected template.
 * Renders the application's resume using the template system for consistency.
 */
const PortfolioPreview: React.FC<Props> = ({
  application,
  template = 'modern-minimal',
  theme = 'modern-minimal',
  type = 'resume',
  onUpdate,
  onDownloadResume
}) => {
  const { resume, slug } = application;

  // Render the selected style
  const renderContent = () => {
    if (type === 'web') {
      const ThemeComponent = WEB_THEMES[theme] || WEB_THEMES['modern-minimal'];
      const profileWithPhoto: UserProfile = {
        ...resume,
        profilePhotoUrl: application.profilePhotoUrl
      };
      const isAdminPreview = window.location.pathname.startsWith('/admin');
      return (
        <div className={isAdminPreview ? 'relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800' : ''}>
          <ThemeComponent
            data={profileWithPhoto}
            onDownloadResume={onDownloadResume}
            isPreview={isAdminPreview}
          />
        </div>
      );
    }

    const props = { data: resume, slug };
    switch (template) {
      case 'modern-minimal': return <ModernMinimal {...props} />;
      case 'professional-classic': return <ProfessionalClassic {...props} />;
      case 'creative-bold': return <CreativeBold {...props} />;
      case 'tech-focused': return <TechFocused {...props} />;
      default: return <ModernMinimal {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      {renderContent()}
    </div>
  );
};

export default PortfolioPreview;
