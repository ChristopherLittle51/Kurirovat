import React from 'react';

interface ProfilePhotoProps {
    src?: string;
    alt: string;
    className: string;
    imageClassName?: string;
    fallbackClassName?: string;
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
    src,
    alt,
    className,
    imageClassName = 'w-full h-full object-cover',
    fallbackClassName = 'bg-slate-200 dark:bg-slate-800',
}) => {
    return (
        <div className={`${className} ${src ? '' : fallbackClassName}`} aria-label={src ? undefined : `${alt} profile photo placeholder`}>
            {src ? (
                <img src={src} alt={alt} className={imageClassName} />
            ) : (
                <div className="h-full w-full bg-linear-to-br from-slate-200 via-slate-100 to-slate-300 dark:from-slate-800 dark:via-slate-900 dark:to-slate-700" />
            )}
        </div>
    );
};

export default ProfilePhoto;
