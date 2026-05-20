import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { POSTURE_STATES, PostureState } from '../../common/enums/posture-state.enum.js';

export class CreateTimelineEntryDto {
  @ApiProperty({
    description: '날짜 (YYYY-MM-DD)',
    example: '2026-04-11',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date는 YYYY-MM-DD 형식이어야 합니다.',
  })
  date!: string;

  @ApiProperty({
    description: '시작 시각 (HH:mm)',
    example: '09:00',
    pattern: '^\\d{2}:\\d{2}$',
  })
  @Matches(/^\d{2}:\d{2}$/, { message: 'time은 HH:mm 형식이어야 합니다.' })
  time!: string;

  @ApiProperty({
    description: '우세 자세 상태',
    enum: POSTURE_STATES,
    example: 'GOOD_POSTURE',
  })
  @IsEnum(POSTURE_STATES, {
    message: `dominantState는 ${POSTURE_STATES.join(', ')} 중 하나이어야 합니다.`,
  })
  dominantState!: PostureState;

  @ApiPropertyOptional({ description: '메시지', example: '' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class CreateTimelineEntryResponseDto {
  @ApiProperty({ description: '처리된 항목 수', example: 1 })
  accepted!: number;
}
