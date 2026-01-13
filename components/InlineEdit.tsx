import React, { useState, useEffect, useRef } from 'react';

interface Props {
    value: string;
    onChange: (newValue: string) => void;
    className?: string;
    multiline?: boolean;
    placeholder?: string;
}

const InlineEdit: React.FC<Props> = ({ value, onChange, className = '', multiline = false, placeholder = 'Click to edit' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setTempValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (tempValue !== value) {
            onChange(tempValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            handleBlur();
        }
        if (e.key === 'Escape') {
            setTempValue(value);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        if (multiline) {
            return (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-white border border-blue-400 rounded p-1 outline-none min-h-[60px] ${className}`}
                />
            );
        }
        return (
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`w-full bg-white border border-blue-400 rounded p-1 outline-none ${className}`}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer hover:bg-gray-100/50 hover:outline hover:outline-1 hover:outline-dashed hover:outline-gray-400 rounded px-1 -mx-1 transition-colors ${!value ? 'text-gray-400 italic' : ''} ${className}`}
            title="Click to edit"
        >
            {value || placeholder}
        </div>
    );
};

export default InlineEdit;
