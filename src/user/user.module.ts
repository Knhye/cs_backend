import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BadgeModule } from '../badge/badge.module.js';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

@Module({
  imports: [AuthModule, BadgeModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
