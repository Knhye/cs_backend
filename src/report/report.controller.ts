import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiCommonResponse } from '../common/decorators/api-common-response.decorator.js';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator.js';
import { ReportHistoryQueryDto } from './dto/report-query.dto.js';
import {
  CurrentReportResponseDto,
  ReportDetailResponseDto,
  ReportHistoryResponseDto,
  ResendResponseDto,
} from './dto/report-response.dto.js';
import { ReportService } from './report.service.js';

@ApiTags('Report')
@Controller('users/me/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '이번 주 리포트 미리보기 (FR-06-01)',
    description:
      '이번 주(월~일) KST 기준 데이터를 실시간 집계하여 반환합니다. 스냅샷이 아닌 라이브 데이터입니다.',
  })
  @ApiCommonResponse({ type: CurrentReportResponseDto })
  async getCurrentReport(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CurrentReportResponseDto> {
    return this.reportService.getCurrentReport(user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '리포트 이력 조회 (FR-06-01)',
    description:
      'from, to 주 시작일(월요일) 범위로 저장된 주간 리포트 목록을 반환합니다. 파라미터 생략 시 전체 이력.',
  })
  @ApiCommonResponse({ type: ReportHistoryResponseDto })
  async getReportHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ReportHistoryQueryDto,
  ): Promise<ReportHistoryResponseDto> {
    return this.reportService.getReportHistory(user.id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '리포트 단건 조회 (FR-06-01)',
    description:
      'weekly_reports.payload 스냅샷과 발송 메타데이터를 반환합니다. 타 유저 리포트 접근 시 403.',
  })
  @ApiParam({ name: 'id', description: '리포트 ID' })
  @ApiCommonResponse({ type: ReportDetailResponseDto })
  async getReportById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<ReportDetailResponseDto> {
    return this.reportService.getReportById(user.id, id);
  }

  @Post(':id/resend')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '리포트 재발송 (FR-06-01)',
    description:
      '실패/미발송 리포트를 user_settings.report_push_way로 재발송 큐에 등록합니다. 이미 SENT 상태이면 409.',
  })
  @ApiParam({ name: 'id', description: '리포트 ID' })
  @ApiCommonResponse({ type: ResendResponseDto })
  async resendReport(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<ResendResponseDto> {
    return this.reportService.resendReport(user.id, id);
  }
}
