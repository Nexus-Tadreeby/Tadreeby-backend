import { extname } from 'path';

/**
 * Generate a formatted filename with student name, file type, timestamp and random string
 * Format: {firstName}_{lastName}_{fileType}_{timestamp}_{randomString}.{extension}
 * Example: shahd_abu_sharif_verification_document_1751545200123_a1b2c3.pdf
 */
export function generateFileName(
    firstName: string,
    lastName: string,
    fileType: string,
    originalFilename: string,
): string {
    const ext = extname(originalFilename).toLowerCase();
    const sanitizedFirst = sanitizeName(firstName);
    const sanitizedLast = sanitizeName(lastName);
    const sanitizedType = sanitizeName(fileType);
    const timestamp = Date.now();
    const randomString = generateRandomString(6);

    return `${sanitizedFirst}_${sanitizedLast}_${sanitizedType}_${timestamp}_${randomString}${ext}`;
}

/**
 * Generate a random string for uniqueness
 */
function generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Sanitize a name string for safe filename usage
 * Remove special characters, replace spaces with underscores, lowercase
 */
function sanitizeName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_\-]/g, '');
}

/**
 * File type labels for consistent naming
 */
export const FileTypeLabel = {
    PROFILE: 'profile_picture',
    CV: 'cv',
    VERIFICATION: 'verification_document',
    TASK: 'task',
} as const;

/**
 * Mapping from FileType enum values to FileTypeLabel keys
 */
export const FileTypeToLabel = {
    'profile': FileTypeLabel.PROFILE,
    'cv': FileTypeLabel.CV,
    'verification': FileTypeLabel.VERIFICATION,
    'task': FileTypeLabel.TASK,
} as const;
