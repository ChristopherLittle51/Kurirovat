import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
    value: string;
    onChange: (newValue: string) => void;
    className?: string;
    placeholder?: string;
    as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3';
    multiline?: boolean;
}

/**
 * Google Docs-style editable text component.
 * Always editable, no click-to-edit - content is directly editable.
 */
const EditableText: React.FC<Props> = ({
    value,
    onChange,
    className = '',
    placeholder = 'Type here...',
    as: Element = 'div',
    multiline = false,
}) => {
    const ref = useRef<HTMLElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Sync external value changes
    useEffect(() => {
        if (ref.current && ref.current.innerText !== value) {
            ref.current.innerText = value;
        }
    }, [value]);

    const handleInput = useCallback(() => {
        if (ref.current) {
            const newValue = ref.current.innerText;
            if (newValue !== value) {
                onChange(newValue);
            }
        }
    }, [onChange, value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Handle enter key for single-line inputs
        if (!multiline && e.key === 'Enter') {
            e.preventDefault();
            ref.current?.blur();
        }
        // Handle tab to move to next field
        if (e.key === 'Tab') {
            // Let default tab behavior work
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    const isEmpty = !value || value.trim() === '';

    return (
        <Element
            ref={ref as any}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
        outline-none transition-all duration-150 
        ${isFocused ? 'bg-blue-50/50 ring-1 ring-blue-200 rounded' : ''}
        ${isEmpty && !isFocused ? 'text-gray-400' : ''}
        ${className}
      `}
            data-placeholder={placeholder}
            style={{
                minWidth: '20px',
                cursor: 'text',
            }}
        >
            {isEmpty && !isFocused ? placeholder : undefined}
        </Element>
    );
};

export default EditableText;
