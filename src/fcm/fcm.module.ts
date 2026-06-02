import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FcmService } from './fcm.service.js';

@Module({
  imports: [PrismaModule],
  providers: [FcmService],
  exports: [FcmService],
})
export class FcmModule {}
