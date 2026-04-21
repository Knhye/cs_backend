import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BadgeController } from './badge.controller.js';
import { BadgeService } from './badge.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BadgeController],
  providers: [BadgeService],
  exports: [BadgeService],
})
export class BadgeModule {}
