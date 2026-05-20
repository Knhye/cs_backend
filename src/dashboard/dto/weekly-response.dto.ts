import { ApiProperty } from '@nestjs/swagger';
import { WEEKDAY_VALUES, Weekday } from '../../common/enums/weekday.enum.js';

export class WeeklyDayDto {
  @ApiProperty({ description: '일자(YYYY-MM-DD)', example: '2026-04-06' })
  date!: string;

  @ApiProperty({ description: '해당 일 총 시간 대비 비정자세 유지 시간 백분율 (0~100)' })
  badPostureRatio!: number;
}

export class WeeklyDashboardDto {
  @ApiProperty({ description: '주 시작일(월요일)', example: '2026-04-06' })
  from!: string;

  @ApiProperty({ description: '주 종료일(일요일)', example: '2026-04-12' })
  to!: string;

  @ApiProperty({
    description: '월~일 7일치 집계 (해당 일자 기록이 없으면 0/null)',
    type: [WeeklyDayDto],
  })
  days!: WeeklyDayDto[];

  @ApiProperty({ description: '주간 거북목 누적 시간(초)' })
  turtleNeckTotalSec!: number;

  @ApiProperty({ description: '주간 라운드 숄더 누적 시간(초)' })
  roundShoulderTotalSec!: number;

  @ApiProperty({ description: '주간 자세 비대칭 누적 시간(초)' })
  shoulderAsymmetryTotalSec!: number;

  @ApiProperty({ description: '주간 어둠 환경 누적 시간(초)' })
  darkEnvTotalSec!: number;

  @ApiProperty({ description: '주 총 시간 대비 정자세 유지 시간 백분율 (0~100)' })
  goodPostureRatio!: number;

  @ApiProperty({
    description: '주중 건강 점수가 가장 낮은 요일. 모든 일자 점수가 null이면 null',
    enum: WEEKDAY_VALUES,
    nullable: true,
    example: 'WED',
  })
  worstWeekday!: Weekday | null;
}
