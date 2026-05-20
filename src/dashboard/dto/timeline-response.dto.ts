import { ApiProperty } from '@nestjs/swagger';
import { POSTURE_STATES, PostureState } from '../../common/enums/posture-state.enum.js';

export class TimelineBucketDto {
  @ApiProperty({ description: '구간 시작 시각 (HH:mm)', example: '09:00' })
  time!: string;

  @ApiProperty({
    description: '해당 구간의 우세 상태. 데이터 없으면 null',
    enum: POSTURE_STATES,
    nullable: true,
  })
  dominantState!: PostureState | null;

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
