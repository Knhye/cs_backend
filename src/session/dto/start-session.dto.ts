import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty } from 'class-validator';

export class StartSessionDto {
  @ApiProperty({
    description: '세션 시작 시각 (ISO 8601, UTC)',
    example: '2026-04-11T09:00:00.000Z',
  })
  @IsISO8601({}, { message: 'startedAt은 ISO 8601 형식이어야 합니다.' })
  @IsNotEmpty()
  startedAt!: string;
}
