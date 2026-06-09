import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiCommonResponse } from '../common/decorators/api-common-response.decorator.js';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator.js';
import { DashboardService } from './dashboard.service.js';
import { WeeklyQueryDto, DailyQueryDto } from './dto/dashboard-query.dto.js';
import { DailyDashboardDto } from './dto/daily-response.dto.js';
import {
  CreateTimelineEntryDto,
  CreateTimelineEntryResponseDto,
} from './dto/timeline-create.dto.js';
import { TimelineDashboardDto } from './dto/timeline-response.dto.js';
import { TodayHealthScoreDto } from './dto/today-response.dto.js';
import { WeeklyDashboardDto } from './dto/weekly-response.dto.js';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('today')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '오늘의 건강 점수 (FR-04-01)',
    description: 'Asia/Seoul 기준 오늘의 자세 점수, 경고 횟수, 어제/지난주 대비 변화율을 반환합니다.',
  })
  @ApiCommonResponse({ type: TodayHealthScoreDto })
  async getToday(@CurrentUser() user: CurrentUserPayload): Promise<TodayHealthScoreDto> {
    return this.dashboardService.getTodayHealthScore(user.id);
  }

  @Get('weekly')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '주간 대시보드 (FR-04-02)',
    description:
      'from(월요일)부터 일요일까지 7일치 일별 통계를 반환합니다.\n\n' +
      '각 일자별 goodPostureRatio, badPostureRatio가 포함됩니다.',
  })
  @ApiCommonResponse({ type: WeeklyDashboardDto })
  async getWeekly(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: WeeklyQueryDto,
  ): Promise<WeeklyDashboardDto> {
    return this.dashboardService.getWeekly(user.id, query.from);
  }

  @Get('daily')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '일간 슬롯별 감지 통계 (FR-04-03)',
    description:
      '3시간 단위 8개 슬롯(0~7)의 감지 시간(초) 통계를 반환합니다.\n\n' +
      'date 생략 시 오늘(KST) 기준으로 조회합니다.\n\n' +
      'totalDetectionSec = good + turtleNeck + roundShoulder + shoulderAsymmetry + darkEnv + unclassified 를 보장합니다.',
  })
  @ApiCommonResponse({ type: DailyDashboardDto })
  async getDaily(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: DailyQueryDto,
  ): Promise<DailyDashboardDto> {
    return this.dashboardService.getDailySlots(user.id, query.date);
  }

  @Post('timeline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '타임라인 항목 추가 (FR-04-04)',
    description: '자세 변동 시 클라이언트가 타임라인 항목을 서버에 저장합니다.',
  })
  @ApiCommonResponse({ type: CreateTimelineEntryResponseDto })
  async createTimelineEntry(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTimelineEntryDto,
  ): Promise<CreateTimelineEntryResponseDto> {
    return this.dashboardService.createTimelineEntry(user.id, dto);
  }

  @Get('timeline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '날짜별 타임라인 조회 (FR-04-04)',
    description: '저장된 타임라인 항목을 시각 오름차순으로 반환합니다.',
  })
  @ApiCommonResponse({ type: TimelineDashboardDto })
  async getTimeline(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: DailyQueryDto,
  ): Promise<TimelineDashboardDto> {
    return this.dashboardService.getTimeline(user.id, query.date!);
  }
}
