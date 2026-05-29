import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { SessionModule } from './session/session.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { BadgeModule } from './badge/badge.module.js';
import { ReportModule } from './report/report.module.js';
import { AppController } from './app.controller.js';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60_000, limit: 30 },
      { name: 'long', ttl: 3_600_000, limit: 500 },
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UserModule,
    SessionModule,
    DashboardModule,
    BadgeModule,
    ReportModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
