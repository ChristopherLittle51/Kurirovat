import React, { useState } from 'react';
import { Experience } from '../../types';
import { Trash2, GripVertical, Plus, Calendar } from 'lucide-react';
import EditableText from './EditableText';

interface Props {
    experience: Experience;
    onChange: (exp: Experience) => void;
    onDelete: () => void;
    dragHandleProps?: any;
}

/**
 * Experience editing card with inline editing for all fields.
 * Supports multiple bullet points with add/remove functionality.
 */
const ExperienceCard: React.FC<Props> = ({
    experience,
    onChange,
    onDelete,
    dragHandleProps,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleFieldChange = (field: keyof Experience, value: any) => {
        onChange({ ...experience, [field]: value });
    };

    const handleBulletChange = (index: number, value: string) => {
        const newDesc = [...(experience.description || [])];
        newDesc[index] = value;
        handleFieldChange('description', newDesc);
    };

    const handleAddBullet = () => {
        const newDesc = [...(experience.description || []), ''];
        handleFieldChange('description', newDesc);
    };

    const handleRemoveBullet = (index: number) => {
        const newDesc = experience.description.filter((_, i) => i !== index);
        handleFieldChange('description', newDesc);
    };

    return (
        <div
            className="group relative bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:border-blue-200 hover:shadow-sm transition-all"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Drag Handle & Delete */}
            <div className={`absolute -left-2 top-4 flex flex-col gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                <div
                    {...dragHandleProps}
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 bg-white rounded shadow-sm border"
                >
                    <GripVertical size={14} />
                </div>
            </div>

            <button
                onClick={onDelete}
                className={`absolute -right-2 -top-2 p-1.5 bg-white text-red-500 rounded-full shadow-sm border hover:bg-red-50 transition-all ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
                <Trash2 size={14} />
            </button>

            {/* Header Row: Role & Dates */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                <div className="flex-1">
                    <EditableText
                        value={experience.role}
                        onChange={(v) => handleFieldChange('role', v)}
                        placeholder="Role Title"
                        className="text-lg font-bold text-gray-900"
                        as="h3"
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
                    <Calendar size={14} className="text-gray-400" />
                    <EditableText
                        value={experience.startDate}
                        onChange={(v) => handleFieldChange('startDate', v)}
                        placeholder="Start"
                        className="font-medium w-20 text-center"
                    />
                    <span className="text-gray-400">–</span>
                    <EditableText
                        value={experience.endDate}
                        onChange={(v) => handleFieldChange('endDate', v)}
                        placeholder="End"
                        className="font-medium w-20 text-center"
                    />
                </div>
            </div>

            {/* Company */}
            <EditableText
                value={experience.company}
                onChange={(v) => handleFieldChange('company', v)}
                placeholder="Company Name"
                className="text-md font-semibold text-gray-700 mb-3"
            />

            {/* Bullet Points */}
            <ul className="space-y-2">
                {(experience.description || []).map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 group/bullet">
                        <span className="text-gray-400 mt-1 select-none">•</span>
                        <EditableText
                            value={bullet}
                            onChange={(v) => handleBulletChange(idx, v)}
                            placeholder="Describe your achievement..."
                            className="flex-1 text-sm text-gray-700"
                            multiline
                        />
                        <button
                            onClick={() => handleRemoveBullet(idx)}
                            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/bullet:opacity-100 transition-opacity"
                        >
                            <Trash2 size={12} />
                        </button>
                    </li>
                ))}
            </ul>

            {/* Add Bullet Button */}
            <button
                onClick={handleAddBullet}
                className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
            >
                <Plus size={12} />
                Add bullet point
            </button>
        </div>
    );
};

export default ExperienceCard;
