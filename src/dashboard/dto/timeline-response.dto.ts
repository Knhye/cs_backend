import { ApiProperty } from '@nestjs/swagger';

export const TIMELINE_STATES = ['GOOD', 'WARN', 'BAD'] as const;
export type TimelineDominantState = (typeof TIMELINE_STATES)[number];

export class TimelineBucketDto {
  @ApiProperty({ description: '구간 시작 시각 (HH:mm)', example: '09:00' })
  time!: string;

  @ApiProperty({
    description: '해당 구간의 우세 상태. 데이터 없으면 null',
    enum: TIMELINE_STATES,
    nullable: true,
  })
  dominantState!: TimelineDominantState | null;

  @ApiProperty({ description: '메시지 (기본값: 빈 문자열)', example: '' })
  message!: string;
}

export class TimelineDashboardDto {
  @ApiProperty({ description: '조회 일자(YYYY-MM-DD, Asia/Seoul)' })
  date!: string;

  @ApiProperty({
    description: '타임라인 항목 목록 (데이터 있는 것만)',
    type: [TimelineBucketDto],
  })
  buckets!: TimelineBucketDto[];
}
