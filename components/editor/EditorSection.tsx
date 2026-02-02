import React, { useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';

interface Props {
    title: string;
    children: React.ReactNode;
    onAdd?: () => void;
    addLabel?: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    isDraggable?: boolean;
    isEmpty?: boolean;
    dragHandleProps?: any;
}

/**
 * Collapsible section wrapper for resume editor.
 * Includes add button, collapse toggle, and optional drag handle.
 */
const EditorSection: React.FC<Props> = ({
    title,
    children,
    onAdd,
    addLabel = 'Add Item',
    collapsible = true,
    defaultCollapsed = false,
    isDraggable = false,
    isEmpty = false,
    dragHandleProps,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
        <section className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                {isDraggable && (
                    <div
                        {...dragHandleProps}
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <GripVertical size={18} />
                    </div>
                )}

                <h2 className="flex-1 text-sm font-semibold uppercase tracking-wider text-gray-700">
                    {title}
                </h2>

                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                        <Plus size={14} />
                        {addLabel}
                    </button>
                )}

                {collapsible && (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                )}
            </div>

            {/* Section Content */}
            {!isCollapsed && (
                <div className="p-4">
                    {isEmpty ? (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-sm">No items yet</p>
                            {onAdd && (
                                <button
                                    onClick={onAdd}
                                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    + {addLabel}
                                </button>
                            )}
                        </div>
                    ) : (
                        children
                    )}
                </div>
            )}
        </section>
    );
};

export default EditorSection;
