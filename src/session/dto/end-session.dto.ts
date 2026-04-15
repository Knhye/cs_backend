import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty } from 'class-validator';

export class EndSessionDto {
  @ApiProperty({
    description: '세션 종료 시각 (ISO 8601, UTC)',
    example: '2026-04-11T11:30:00.000Z',
  })
  @IsISO8601({}, { message: 'endedAt은 ISO 8601 형식이어야 합니다.' })
  @IsNotEmpty()
  endedAt!: string;
}
