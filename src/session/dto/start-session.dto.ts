import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionSource } from '@prisma/client';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional } from 'class-validator';

export class StartSessionDto {
  @ApiProperty({
    description: '세션 시작 시각 (ISO 8601, UTC)',
    example: '2026-04-11T09:00:00.000Z',
  })
  @IsISO8601({}, { message: 'startedAt은 ISO 8601 형식이어야 합니다.' })
  @IsNotEmpty()
  startedAt!: string;

  @ApiPropertyOptional({
    enum: SessionSource,
    description: '세션 생성 주체 (WEB | EXTENSION). 기본값 WEB.',
    example: 'WEB',
  })
  @IsOptional()
  @IsEnum(SessionSource, { message: 'source는 WEB 또는 EXTENSION이어야 합니다.' })
  source?: SessionSource;
}
