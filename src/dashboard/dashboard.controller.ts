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
import { CurrentSlotDto } from './dto/current-slot-response.dto.js';
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
    description:
      'Asia/Seoul 기준 오늘의 자세 점수, 경고 횟수, 어제/지난주 대비 변화율을 반환합니다.',
  })
  @ApiCommonResponse({ type: TodayHealthScoreDto })
  async getToday(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TodayHealthScoreDto> {
    return this.dashboardService.getTodayHealthScore(user.id);
  }

  @Get('weekly')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '주간 스크린타임 (FR-04-02)',
    description:
      'from(월요일)부터 일요일까지 7일치 daily_stats + 주중 worstWeekday/worstHour 반환.',
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
    summary: '일간 스크린타임 (FR-04-03)',
    description:
      '요청 시각(Asia/Seoul)이 속한 3시간 슬롯의 자세 감지 건수를 반환합니다.\n\n' +
      '슬롯 경계(0, 3, 6, 9, 12, 15, 18, 21시)를 지나면 건수가 초기화됩니다.\n\n' +
      '응답값은 daily_slot_stats 테이블에 저장되어 추후 일간 스크린타임 상세 보기에서 활용됩니다.',
  })
  @ApiCommonResponse({ type: CurrentSlotDto })
  async getDaily(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CurrentSlotDto> {
    return this.dashboardService.getCurrentSlotStats(user.id);
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
    return this.dashboardService.getTimeline(user.id, query.date);
  }
}
