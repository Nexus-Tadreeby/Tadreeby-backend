import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    BadRequestException,
    ConflictException,
    NotFoundException,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string = 'Internal server error';
        let fields: Array<{ field: string; message: string; code?: string }> | undefined;

        //  Handle Zod Validation Errors
        if (exception instanceof ZodError) {
            statusCode = HttpStatus.BAD_REQUEST;
            message = 'Validation failed';
            fields = exception.issues.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code,
            }));
        }
        // Handle NestJS HttpExceptions
        else if (exception instanceof BadRequestException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse() as any;

            // If the exception already has a custom response structure
            if (typeof exceptionResponse === 'object' && exceptionResponse.fields) {
                message = exceptionResponse.message || 'Bad request';
                fields = exceptionResponse.fields;
                statusCode = exceptionResponse.statusCode || statusCode;
            } else {
                message = exceptionResponse.message || 'Bad request';
            }
        }
        //  Handle ConflictException (Duplicate entries)
        else if (exception instanceof ConflictException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse() as any;
            message = exceptionResponse.message || 'Resource already exists';
        }
        //  Handle NotFoundException
        else if (exception instanceof NotFoundException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse() as any;
            message = exceptionResponse.message || 'Resource not found';
        }
        //  Handle UnauthorizedException
        else if (exception instanceof UnauthorizedException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse() as any;
            message = exceptionResponse.message || 'Unauthorized';
        }
        // Handle ForbiddenException
        else if (exception instanceof ForbiddenException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse() as any;
            message = exceptionResponse.message || 'Forbidden';
        }
        // Handle generic HttpException
        else if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse() as any;

            if (typeof exceptionResponse === 'object') {
                message = exceptionResponse.message || exceptionResponse.error || 'Http exception';
                fields = exceptionResponse.fields;
            } else {
                message = exceptionResponse || 'Http exception';
            }
        }
        //  Handle Prisma Errors
        else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            // P2002: Unique constraint failed
            if (exception.code === 'P2002') {
                statusCode = HttpStatus.CONFLICT;
                const target = exception.meta?.target as string[] || ['field'];
                message = `Duplicate entry: ${target.join(', ')} already exists`;
                fields = target.map((field) => ({
                    field,
                    message: `${field} must be unique`,
                    code: 'P2002',
                }));
            }
            // P2025: Record not found
            else if (exception.code === 'P2025') {
                statusCode = HttpStatus.NOT_FOUND;
                message = 'Record not found';
            }
            // Other Prisma errors
            else {
                statusCode = HttpStatus.BAD_REQUEST;
                message = `Database error: ${exception.message}`;
            }
        }
        // Handle Prisma Validation Errors
        else if (exception instanceof Prisma.PrismaClientValidationError) {
            statusCode = HttpStatus.BAD_REQUEST;
            message = 'Invalid data provided';
        }
        //  Handle unknown errors
        else if (exception instanceof Error) {
            message = exception.message;

            // For development, you might want to log the stack trace
            if (process.env.NODE_ENV === 'development') {
                console.error('Unhandled exception:', exception);
            }
        }
        // Handle non-Error objects
        else {
            message = 'An unknown error occurred';
            if (process.env.NODE_ENV === 'development') {
                console.error('Unknown exception:', exception);
            }
        }

        // Unified error response
        const errorResponse = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
            statusCode,
            path: request.url,
            ...(fields && { fields }),
        };

        //  Remove fields if empty
        if (fields && fields.length === 0) {
            delete errorResponse.fields;
        }

        response.status(statusCode).json(errorResponse);
    }
}