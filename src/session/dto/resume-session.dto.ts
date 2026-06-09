import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty } from 'class-validator';

export class ResumeSessionDto {
  @ApiProperty({ description: '재개 시각 (ISO 8601, UTC)', example: '2026-06-09T11:45:00.000Z' })
  @IsISO8601({}, { message: 'resumedAt은 ISO 8601 형식이어야 합니다.' })
  @IsNotEmpty()
  resumedAt!: string;
}

export class ResumeSessionResponseDto {
  @ApiProperty({ description: '세션 ID' }) sessionId!: string;
  @ApiProperty({ enum: ['ACTIVE'] }) status!: 'ACTIVE';
  @ApiProperty({ description: '재개 시각' }) resumedAt!: Date;
  @ApiProperty({ description: '누적 일시정지 시간(초)' }) totalPausedSec!: number;
}
