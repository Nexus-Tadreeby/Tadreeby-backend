// common/interceptors/file-validation.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    BadRequestException
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class FileValidationInterceptor implements NestInterceptor {
    private readonly maxSize = 10 * 1024 * 1024; 
    private readonly allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
    ];
    private readonly allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const file = request.file;

        if (!file) {
            throw new BadRequestException('Verification file is required');
        }

       
        if (file.size > this.maxSize) {
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
            throw new BadRequestException(
                `File size exceeds the allowed limit (10 MB). Current file size: ${sizeInMB} MB`
            );
        }

    
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `File type is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`
            );
        }

       
        const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
        if (!this.allowedExtensions.includes(ext)) {
            throw new BadRequestException(
                `File extension is not allowed. Allowed extensions: ${this.allowedExtensions.join(', ')}`
            );
        }

        return next.handle();
    }
}