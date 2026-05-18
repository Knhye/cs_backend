import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ServiceKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers['x-service-key'];
    const expected = this.configService.get<string>('SERVICE_API_KEY');
    if (!expected || provided !== expected) {
      throw new UnauthorizedException('유효하지 않은 서비스 키입니다.');
    }
    return true;
  }
}
