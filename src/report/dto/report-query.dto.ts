import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class ReportHistoryQueryDto {
  @ApiPropertyOptional({
    description: '조회 시작 주 시작일(월요일, YYYY-MM-DD)',
    example: '2026-03-02',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from은 YYYY-MM-DD 형식이어야 합니다.' })
  from?: string;

  @ApiPropertyOptional({
    description: '조회 종료 주 시작일(월요일, YYYY-MM-DD)',
    example: '2026-04-13',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to는 YYYY-MM-DD 형식이어야 합니다.' })
  to?: string;
}
