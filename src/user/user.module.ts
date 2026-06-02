import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BadgeModule } from '../badge/badge.module.js';
import { FcmModule } from '../fcm/fcm.module.js';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

@Module({
  imports: [AuthModule, BadgeModule, FcmModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
