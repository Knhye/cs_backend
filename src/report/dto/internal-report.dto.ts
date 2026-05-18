import { ApiProperty } from '@nestjs/swagger';
import { DeliveryWay } from '@prisma/client';
import {
  IsEnum,
  IsObject,
  IsString,
} from 'class-validator';
import {
  ReportHealthScoreDto,
  ReportSessionDto,
  ReportTimelineItemDto,
  TopIssueDto,
} from './report-response.dto.js';

export class WeeklyBatchStatsDto {
  @ApiProperty() weekStartDate!: string;
  @ApiProperty() weekEndDate!: string;
  @ApiProperty({ type: ReportSessionDto }) session!: ReportSessionDto;
  @ApiProperty({ type: ReportHealthScoreDto }) healthScore!: ReportHealthScoreDto;
  @ApiProperty({ type: [ReportTimelineItemDto] }) timeline!: ReportTimelineItemDto[];
  @ApiProperty({ type: [TopIssueDto] }) topIssues!: TopIssueDto[];
}

export class WeeklyBatchItemDto {
  @ApiProperty() userId!: string;
  @ApiProperty() email!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: DeliveryWay }) deliveryWay!: DeliveryWay;
  @ApiProperty({ type: WeeklyBatchStatsDto }) stats!: WeeklyBatchStatsDto;
}

export class SaveReportDto {
  @IsString()
  @ApiProperty({ description: '유저 ID' })
  userId!: string;

  @IsString()
  @ApiProperty({ description: '주 시작일 (YYYY-MM-DD)', example: '2026-05-11' })
  weekStartDate!: string;

  @IsString()
  @ApiProperty({ description: '주 종료일 (YYYY-MM-DD)', example: '2026-05-17' })
  weekEndDate!: string;

  @IsEnum(DeliveryWay)
  @ApiProperty({ enum: DeliveryWay })
  deliveryWay!: DeliveryWay;

  @IsString()
  @ApiProperty({ description: 'OpenAI가 생성한 솔루션 텍스트' })
  aiSolution!: string;

  @IsObject()
  @ApiProperty({ description: '주간 통계 페이로드 (WeeklyBatchStatsDto)' })
  stats!: WeeklyBatchStatsDto;
}

export class SaveReportResponseDto {
  @ApiProperty({ description: '생성/업서트된 리포트 ID' })
  reportId!: string;
}
