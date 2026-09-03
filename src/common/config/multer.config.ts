// common/config/multer.config.ts
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

// 5MB limit for verification documents, profile images, and logos
const SMALL_FILE_LIMIT = 5 * 1024 * 1024;

// 10MB limit for task files
const LARGE_FILE_LIMIT = 10 * 1024 * 1024;

export const multerConfig = {
    storage: memoryStorage(),
    limits: {
        fileSize: SMALL_FILE_LIMIT, // 5MB for registration verification documents
    },
    fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

        const ext = extname(file.originalname).toLowerCase();

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return callback(
                new BadRequestException(`Type of file not allowed: ${file.mimetype}`),
                false,
            );
        }

        if (!allowedExtensions.includes(ext)) {
            return callback(
                new BadRequestException(`Extension of file not allowed: ${ext}`),
                false,
            );
        }

        callback(null, true);
    },
};

// Multer config for profile image uploads (5MB limit)
export const profileImageMulterConfig = {
    limits: {
        fileSize: SMALL_FILE_LIMIT, // 5MB
    },
};

// Multer config for CV uploads (5MB limit)
export const cvMulterConfig = {
    limits: {
        fileSize: SMALL_FILE_LIMIT, // 5MB
    },
};

// Multer config for verification document uploads (5MB limit)
export const verificationDocMulterConfig = {
    limits: {
        fileSize: SMALL_FILE_LIMIT, // 5MB
    },
};

// Multer config for task file uploads (10MB limit)
export const taskFileMulterConfig = {
    limits: {
        fileSize: LARGE_FILE_LIMIT, // 10MB
    },
};

// Multer config for logo uploads (5MB limit)
export const logoMulterConfig = {
    limits: {
        fileSize: SMALL_FILE_LIMIT, // 5MB
    },
};