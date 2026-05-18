import {
  Body,
  Controller,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceKeyGuard } from '../common/guards/service-key.guard.js';
import { ApiCommonResponse } from '../common/decorators/api-common-response.decorator.js';
import { SaveReportDto, SaveReportResponseDto, WeeklyBatchItemDto } from './dto/internal-report.dto.js';
import { ReportService } from './report.service.js';

@ApiTags('Internal Report (n8n)')
@Controller('reports/internal')
@UseGuards(ServiceKeyGuard)
@ApiHeader({ name: 'x-service-key', description: 'n8n 서비스 키', required: true })
export class InternalReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('weekly-batch')
  @HttpCode(200)
  @ApiOperation({
    summary: '[n8n] 주간 리포트 배치 데이터 조회',
    description: '전전주 통계를 집계하여 reportPushEnabled 유저 배열을 반환합니다. n8n Cron에서 호출합니다.',
  })
  @ApiCommonResponse({ type: WeeklyBatchItemDto, isArray: true })
  async getWeeklyBatch(): Promise<WeeklyBatchItemDto[]> {
    return this.reportService.getWeeklyBatch();
  }

  @Post('save')
  @ApiOperation({
    summary: '[n8n] AI 솔루션 포함 리포트 저장',
    description: 'OpenAI가 생성한 솔루션과 통계를 DB에 저장합니다. 발송 전 상태(PENDING)로 저장됩니다.',
  })
  @ApiCommonResponse({ type: SaveReportResponseDto, status: 201 })
  async saveReport(@Body() dto: SaveReportDto): Promise<SaveReportResponseDto> {
    return this.reportService.saveReport(dto);
  }

  @Patch(':id/sent')
  @HttpCode(200)
  @ApiOperation({
    summary: '[n8n] 리포트 발송 완료 처리',
    description: 'Gmail 발송 성공 후 n8n에서 호출하여 리포트를 SENT 상태로 변경합니다.',
  })
  @ApiCommonResponse({})
  async markSent(@Param('id') id: string): Promise<void> {
    return this.reportService.markReportSent(id);
  }
}
