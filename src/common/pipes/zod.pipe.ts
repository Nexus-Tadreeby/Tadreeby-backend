import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { type ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) { }

    transform(value: unknown) {
        try {
            return this.schema.parse(value);
        } catch (error) {
            if (error instanceof ZodError) {
               
                const fields = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                    received: issue.path.length > 0 ? (value as any)[issue.path[0]] : undefined,
                }));

                throw new BadRequestException({
                    success: false,
                    message: 'Validation failed',
                    fields,
                    timestamp: new Date().toISOString(),
                    statusCode: 400,
                });
            }
            throw new BadRequestException('Validation failed');
        }
    }
}