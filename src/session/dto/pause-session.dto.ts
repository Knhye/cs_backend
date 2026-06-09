import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty } from 'class-validator';

export class PauseSessionDto {
  @ApiProperty({ description: '일시정지 시각 (ISO 8601, UTC)', example: '2026-06-09T11:30:00.000Z' })
  @IsISO8601({}, { message: 'pausedAt은 ISO 8601 형식이어야 합니다.' })
  @IsNotEmpty()
  pausedAt!: string;
}

export class PauseSessionResponseDto {
  @ApiProperty({ description: '세션 ID' }) sessionId!: string;
  @ApiProperty({ enum: ['PAUSED'] }) status!: 'PAUSED';
  @ApiProperty({ description: '일시정지 시각' }) pausedAt!: Date;
  @ApiProperty({ description: '누적 일시정지 시간(초)' }) totalPausedSec!: number;
}
