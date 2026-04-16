import { ApiProperty } from '@nestjs/swagger';
import { DetectionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AvatarStateQueryDto {
  @ApiProperty({
    description: '집계 대상 윈도우(초). 최근 N초 이벤트 기준',
    example: 60,
    minimum: 10,
    maximum: 600,
    required: false,
    default: 60,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'windowSec는 정수여야 합니다.' })
  @Min(10, { message: 'windowSec는 10 이상이어야 합니다.' })
  @Max(600, { message: 'windowSec는 600 이하여야 합니다.' })
  windowSec?: number = 60;
}

export class SymptomSummaryDto {
  @ApiProperty({ description: '감지 유형', enum: DetectionType })
  type!: DetectionType;

  @ApiProperty({ description: '윈도우 내 최대 심각도(1~3)', example: 2 })
  severity!: number;

  @ApiProperty({ description: '윈도우 내 누적 지속 시간(초)', example: 30 })
  durationSec!: number;

  @ApiProperty({ description: '윈도우 내 감지 횟수', example: 2 })
  count!: number;
}

export class AvatarStateResponseDto {
  @ApiProperty({ description: '집계 윈도우(초)', example: 60 })
  windowSec!: number;

  @ApiProperty({
    description: '주요(dominant) 증상. 증상이 없으면 null',
    enum: DetectionType,
    nullable: true,
  })
  dominantSymptom!: DetectionType | null;

  @ApiProperty({
    description: '주요 증상의 심각도(1~3). 증상이 없으면 null',
    nullable: true,
    example: 2,
  })
  severity!: number | null;

  @ApiProperty({
    description: '윈도우 내 발생한 증상 목록(GOOD_POSTURE 제외)',
    type: [SymptomSummaryDto],
  })
  symptoms!: SymptomSummaryDto[];

  @ApiProperty({ description: '아바타 후드 색상', example: 'default' })
  avatarHoodColor!: string;
}
