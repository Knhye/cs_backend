import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/redis/redis.module.js';
import { MailService } from './mail.service.js';

const CODE_PREFIX = 'email:verify:code:';
const VERIFIED_PREFIX = 'email:verify:ok:';
const COOLDOWN_PREFIX = 'email:verify:cooldown:';

const CODE_TTL_SEC = 5 * 60; // 5분
const VERIFIED_TTL_SEC = 30 * 60; // 30분 (회원가입까지 유효)
const COOLDOWN_SEC = 60; // 재발송 쿨다운

@Injectable()
export class EmailVerificationService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly mailService: MailService,
  ) {}

  async sendCode(email: string): Promise<void> {
    const cooldownKey = `${COOLDOWN_PREFIX}${email}`;
    const onCooldown = await this.redis.get(cooldownKey);
    if (onCooldown) {
      throw new BadRequestException(
        '잠시 후 다시 요청해 주세요. (1분 쿨다운)',
      );
    }

    const code = this.generateCode();
    await this.redis.set(
      `${CODE_PREFIX}${email}`,
      code,
      'EX',
      CODE_TTL_SEC,
    );
    await this.redis.set(cooldownKey, '1', 'EX', COOLDOWN_SEC);

    await this.mailService.sendVerificationCode(email, code);
  }

  async verifyCode(email: string, code: string): Promise<void> {
    const key = `${CODE_PREFIX}${email}`;
    const stored = await this.redis.get(key);

    if (!stored || stored !== code) {
      throw new BadRequestException(
        '인증 코드가 올바르지 않거나 만료되었습니다.',
      );
    }

    await this.redis.del(key);
    await this.redis.set(
      `${VERIFIED_PREFIX}${email}`,
      '1',
      'EX',
      VERIFIED_TTL_SEC,
    );
  }

  async assertVerified(email: string): Promise<void> {
    const ok = await this.redis.get(`${VERIFIED_PREFIX}${email}`);
    if (!ok) {
      throw new BadRequestException('이메일 인증이 필요합니다.');
    }
  }

  async consumeVerified(email: string): Promise<void> {
    await this.redis.del(`${VERIFIED_PREFIX}${email}`);
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
