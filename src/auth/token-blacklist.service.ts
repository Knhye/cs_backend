import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/redis/redis.module.js';

@Injectable()
export class TokenBlacklistService {
  private readonly PREFIX = 'blacklist:';

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async blacklist(token: string, expiresInSec: number): Promise<void> {
    await this.redis.set(`${this.PREFIX}${token}`, '1', 'EX', expiresInSec);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.redis.get(`${this.PREFIX}${token}`);
    return result !== null;
  }
}
