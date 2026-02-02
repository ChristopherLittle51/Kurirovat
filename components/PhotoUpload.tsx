import React, { useState } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { uploadProfilePhoto } from '../services/photoService';
import { useAuth } from '../contexts/AuthContext';

interface PhotoUploadProps {
    initialUrl?: string;
    onUploadComplete: (url: string) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ initialUrl, onUploadComplete }) => {
    const { user } = useAuth();
    const [previewUrl, setPreviewUrl] = useState(initialUrl);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB.');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const url = await uploadProfilePhoto(user.id, file);
            setPreviewUrl(url);
            onUploadComplete(url);
        } catch (err) {
            console.error('Upload failed:', err);
            setError('Failed to upload photo. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const removePhoto = () => {
        setPreviewUrl(undefined);
        onUploadComplete('');
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center transition-colors group-hover:border-blue-500 dark:group-hover:border-blue-400">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <Camera className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    )}
                </div>

                {previewUrl && !isUploading && (
                    <button
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                        title="Remove photo"
                    >
                        <X size={14} />
                    </button>
                )}

                <label className="absolute inset-0 cursor-pointer">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                        disabled={isUploading}
                    />
                </label>
            </div>

            <div className="text-center">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Profile Photo</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {previewUrl ? 'Click to change photo' : 'Upload a professional photo'}
                </p>
                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
        </div>
    );
};

export default PhotoUpload;
