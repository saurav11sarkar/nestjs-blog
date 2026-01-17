import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { catchError, map, throwError } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((response) => {
        return {
          statusCode: res.statusCode,
          success: true,
          message: response?.message ?? 'Success',
          meta: response?.meta,
          data: response?.data ?? response,
        };
      }),
      catchError((err: Error) => {
        return throwError(() => err);
      }),
    );
  }
}
