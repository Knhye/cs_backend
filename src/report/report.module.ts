import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import { InternalReportController } from './internal-report.controller.js';
import { ReportController } from './report.controller.js';
import { ReportService } from './report.service.js';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [ReportController, InternalReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
