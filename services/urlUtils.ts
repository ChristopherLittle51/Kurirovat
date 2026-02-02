/**
 * Ensures a URL is absolute by prepending https:// if it doesn't have a protocol.
 */
export const ensureAbsoluteUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        return url;
    }
    return `https://${url}`;
};
