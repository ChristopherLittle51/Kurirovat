import React, { useState } from 'react';
import { TEMPLATES, TemplateId, TemplateMetadata } from './templates';
import { Check, Grid, List } from 'lucide-react';

interface Props {
    title?: string;
    currentTemplate: TemplateId;
    onSelect: (templateId: TemplateId) => void;
}

/**
 * Template picker UI with gallery view and category filters.
 */
const TemplateSwitcher: React.FC<Props> = ({ title = "Choose Template", currentTemplate, onSelect }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filter, setFilter] = useState<'all' | 'professional' | 'creative' | 'tech'>('all');

    const filteredTemplates = filter === 'all'
        ? TEMPLATES
        : TEMPLATES.filter(t => t.category === filter);

    const getCategoryColor = (category: TemplateMetadata['category']) => {
        switch (category) {
            case 'professional': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
            case 'creative': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
            case 'tech': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
        }
    };

    const getTemplatePreviewBg = (id: string) => {
        switch (id) {
            case 'modern-minimal': return 'bg-gradient-to-br from-blue-50 to-white';
            case 'professional-classic': return 'bg-gradient-to-br from-gray-100 to-white';
            case 'creative-bold': return 'bg-gradient-to-br from-purple-500 to-pink-500';
            case 'tech-focused': return 'bg-gradient-to-br from-gray-900 to-gray-800';
            case 'ats-optimized': return 'bg-gradient-to-br from-slate-100 to-white';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{title}</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        <Grid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                {(['all', 'professional', 'creative', 'tech'] as const).map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filter === cat
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Template Grid/List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-3">
                    {filteredTemplates.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => onSelect(template.id as TemplateId)}
                            className={`relative group rounded-lg border-2 overflow-hidden transition-all hover:shadow-md ${currentTemplate === template.id
                                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/50'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            {/* Preview Area */}
                            <div className={`h-24 ${getTemplatePreviewBg(template.id)} flex items-center justify-center`}>
                                <div className={`text-xs font-medium ${template.id === 'tech-focused' ? 'text-white' : 'text-gray-600'}`}>
                                    Preview
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-3 bg-white dark:bg-gray-900 transition-colors">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate transition-colors">{template.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${getCategoryColor(template.category)}`}>
                                        {template.category}
                                    </span>
                                </div>
                            </div>

                            {/* Selected Indicator */}
                            {currentTemplate === template.id && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredTemplates.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => onSelect(template.id as TemplateId)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${currentTemplate === template.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                }`}
                        >
                            {/* Mini Preview */}
                            <div className={`w-12 h-12 rounded ${getTemplatePreviewBg(template.id)} shrink-0`}></div>

                            {/* Info */}
                            <div className="flex-1 text-left">
                                <div className="font-medium text-gray-800 dark:text-gray-200 transition-colors">{template.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">{template.description}</div>
                            </div>

                            {/* Category & Check */}
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(template.category)}`}>
                                    {template.category}
                                </span>
                                {currentTemplate === template.id && (
                                    <Check size={16} className="text-blue-500" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TemplateSwitcher;
