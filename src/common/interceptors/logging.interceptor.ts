import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const date = Date.now();
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    console.log(`Before... ${req.method} ${req.url}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - date;
        console.log(
          `After...  ${req.method} ${req.url}  -status code: ${res.status} - ${duration}ms`,
        );
      }),
    );
  }
}
