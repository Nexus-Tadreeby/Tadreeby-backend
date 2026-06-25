// common/config/multer.config.ts
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';


const uploadPath = './uploads/pending';
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

export const multerConfig = {
    storage: diskStorage({
        destination: (req, file, callback) => {
         
            const path = process.env.UPLOAD_PATH || './uploads/pending';
       
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, { recursive: true });
            }
            callback(null, path);
        },
        filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const fileName = `student-doc-${uniqueSuffix}${ext}`;
            callback(null, fileName);
        },
    }),
    limits: {
        fileSize: 10 * 1024 * 1024, 
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