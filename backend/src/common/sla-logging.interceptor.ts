import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class SlaLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SLA-Monitor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const slaStatus = duration < 500 ? 'OK (<500ms)' : 'SLA_WARN (>=500ms)';
        response.setHeader('X-Response-Time', `${duration}ms`);
        this.logger.log(
          `${request.method} ${request.originalUrl} - ${duration}ms [${slaStatus}]`,
        );
      }),
    );
  }
}