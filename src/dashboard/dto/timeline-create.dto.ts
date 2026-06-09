import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
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
    description: '시작 시각 (HH:mm 또는 HH:mm:ss)',
    example: '09:00',
    pattern: '^\\d{2}:\\d{2}(:\\d{2})?$',
  })
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'time은 HH:mm 또는 HH:mm:ss 형식이어야 합니다.' })
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

  @ApiPropertyOptional({
    description: '클라이언트 중복 방지용 이벤트 ID (UUID). 동일 userId+eventId는 무시됩니다.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'eventId는 UUID v4 형식이어야 합니다.' })
  eventId?: string;
}

export class CreateTimelineEntryResponseDto {
  @ApiProperty({ description: '처리된 항목 수 (중복 시 0)', example: 1 })
  accepted!: number;
}
