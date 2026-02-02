import React, { useState } from 'react';
import { Education } from '../../types';
import { Trash2, GripVertical, Calendar } from 'lucide-react';
import EditableText from './EditableText';

interface Props {
    education: Education;
    onChange: (edu: Education) => void;
    onDelete: () => void;
    dragHandleProps?: any;
}

/**
 * Education editing card with inline editing for all fields.
 */
const EducationCard: React.FC<Props> = ({
    education,
    onChange,
    onDelete,
    dragHandleProps,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleFieldChange = (field: keyof Education, value: string) => {
        onChange({ ...education, [field]: value });
    };

    return (
        <div
            className="group relative bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:border-blue-200 hover:shadow-sm transition-all"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Drag Handle */}
            <div className={`absolute -left-2 top-4 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
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

            {/* Content */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex-1">
                    <EditableText
                        value={education.institution}
                        onChange={(v) => handleFieldChange('institution', v)}
                        placeholder="Institution Name"
                        className="text-base font-bold text-gray-900"
                        as="h3"
                    />
                    <EditableText
                        value={education.degree}
                        onChange={(v) => handleFieldChange('degree', v)}
                        placeholder="Degree / Field of Study"
                        className="text-sm text-gray-600 mt-1"
                    />
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500 shrink-0">
                    <Calendar size={14} className="text-gray-400" />
                    <EditableText
                        value={education.year}
                        onChange={(v) => handleFieldChange('year', v)}
                        placeholder="Year"
                        className="font-medium"
                    />
                </div>
            </div>
        </div>
    );
};

export default EducationCard;
