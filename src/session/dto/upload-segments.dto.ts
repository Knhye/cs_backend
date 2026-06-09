import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DetectionType, SessionSource } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SegmentItemDto {
  @ApiProperty({ description: '클라이언트 이벤트 ID (중복 방지)', required: false })
  @IsOptional()
  @IsString()
  clientEventId?: string;

  @ApiProperty({ enum: DetectionType, description: '감지 상태' })
  @IsEnum(DetectionType)
  state!: DetectionType;

  @ApiProperty({ description: '구간 시작 시각 (ISO 8601, UTC)', example: '2026-06-09T00:00:00.000Z' })
  @IsISO8601()
  startedAt!: string;

  @ApiProperty({ description: '구간 종료 시각 (ISO 8601, UTC)', example: '2026-06-09T00:30:00.000Z' })
  @IsISO8601()
  endedAt!: string;
}

export class UploadSegmentsDto {
  @ApiProperty({ type: [SegmentItemDto], description: '감지 구간 목록 (최대 200건)' })
  @IsArray()
  @ArrayMinSize(1, { message: 'segments는 최소 1건 이상이어야 합니다.' })
  @ArrayMaxSize(200, { message: 'segments는 최대 200건까지 허용됩니다.' })
  @ValidateNested({ each: true })
  @Type(() => SegmentItemDto)
  segments!: SegmentItemDto[];

  @ApiPropertyOptional({
    enum: SessionSource,
    description: '요청 주체 source. 세션 source와 불일치 시 409.',
    example: 'WEB',
  })
  @IsOptional()
  @IsEnum(SessionSource, { message: 'source는 WEB 또는 EXTENSION이어야 합니다.' })
  source?: SessionSource;
}

export class UploadSegmentsResponseDto {
  @ApiProperty({ description: '저장된 구간 수' })
  accepted!: number;
}
