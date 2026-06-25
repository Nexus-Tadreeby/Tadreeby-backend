import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { PaginationResult } from 'src/common/types/unifiedType.types';

@Injectable()
export class PaginationInterceptor<T>
    implements NestInterceptor<PaginationResult<T>, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((result: PaginationResult<T>) => {
                // Check if the result is a paginated response
                if (result && 'meta' in result && 'data' in result) {
                    return {
                        success: true,
                        data: result.data,
                        meta: result.meta,
                    };
                }
                // If not paginated, return as is
                return result;
            }),
        );
    }
}