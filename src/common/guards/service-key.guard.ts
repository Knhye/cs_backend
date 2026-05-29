import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

@Injectable()
export class ServiceKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = String(request.headers['x-service-key'] ?? '');
    const expected = this.configService.getOrThrow<string>('SERVICE_API_KEY');

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    const valid = a.length === b.length && timingSafeEqual(a, b);

    if (!valid) {
      throw new UnauthorizedException('유효하지 않은 서비스 키입니다.');
    }
    return true;
  }
}
