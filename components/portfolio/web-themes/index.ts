import { UserProfile } from '../../../types';
import ModernWebTheme from './ModernWebTheme';
import CreativeWebTheme from './CreativeWebTheme';
import TechWebTheme from './TechWebTheme';
import ATSWebTheme from './ATSWebTheme';

export { ModernWebTheme, CreativeWebTheme, TechWebTheme, ATSWebTheme };

export interface WebThemeProps {
    data: UserProfile;
    onDownloadResume?: () => void;
    isPreview?: boolean;
}

export const WEB_THEMES = {
    'modern-minimal': ModernWebTheme,
    'creative-bold': CreativeWebTheme,
    'tech-focused': TechWebTheme,
    'professional-classic': ModernWebTheme, // Fallback to modern for now
    'ats-optimized': ATSWebTheme,
} as const;

export type WebThemeId = keyof typeof WEB_THEMES;
