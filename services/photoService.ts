import { supabase } from './supabaseClient';

/**
 * Uploads a profile photo to Supabase Storage.
 * @param userId The ID of the user.
 * @param file The photo file to upload.
 * @returns The public URL of the uploaded photo.
 */
export const uploadProfilePhoto = async (userId: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to 'avatars' bucket
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return publicUrl;
};
