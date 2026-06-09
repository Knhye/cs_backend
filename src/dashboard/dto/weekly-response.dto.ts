import { ApiProperty } from '@nestjs/swagger';
import { WEEKDAY_VALUES, Weekday } from '../../common/enums/weekday.enum.js';

export class WeeklyBreakdownDto {
  @ApiProperty() turtleNeckSec!: number;
  @ApiProperty({ description: 'badPostureSec 대비 비율 (0.0~1.0)' }) turtleNeckRatio!: number;
  @ApiProperty() roundShoulderSec!: number;
  @ApiProperty({ description: 'badPostureSec 대비 비율 (0.0~1.0)' }) roundShoulderRatio!: number;
  @ApiProperty() shoulderAsymmetrySec!: number;
  @ApiProperty({ description: 'badPostureSec 대비 비율 (0.0~1.0)' }) shoulderAsymmetryRatio!: number;
}

export class WeeklyDailyStatDto {
  @ApiProperty({ example: '2025-06-02' }) date!: string;
  @ApiProperty({ enum: WEEKDAY_VALUES, example: 'MON' }) weekday!: Weekday;
  @ApiProperty() totalDetectionSec!: number;
  @ApiProperty({ nullable: true, description: '자세 경고 비율 (0.0~1.0), 데이터 없으면 null' })
  badPostureRatio!: number | null;
  @ApiProperty() hasData!: boolean;
}

export class WeeklyDashboardDto {
  @ApiProperty({ description: '주 시작일 (월요일)', example: '2025-06-02' }) weekStartDate!: string;
  @ApiProperty({ description: '주 종료일 (일요일)', example: '2025-06-08' }) weekEndDate!: string;
  @ApiProperty({ description: '총 감지 시간 (초)' }) totalDetectionSec!: number;
  @ApiProperty({ description: '정자세 시간 (초)' }) goodPostureSec!: number;
  @ApiProperty({ description: '자세 경고 시간 (초) = turtleNeck + roundShoulder + shoulderAsymmetry' }) badPostureSec!: number;
  @ApiProperty({ description: '어둠 감지 시간 (초)' }) darkEnvSec!: number;
  @ApiProperty({ description: '위험도 퍼센트 (0~100 정수)' }) riskPercent!: number;
  @ApiProperty({ description: '정자세 비율 (0.0~1.0)' }) goodPostureRatio!: number;
  @ApiProperty({ enum: WEEKDAY_VALUES, nullable: true, example: 'TUE' }) worstWeekday!: Weekday | null;
  @ApiProperty({ type: WeeklyBreakdownDto }) breakdown!: WeeklyBreakdownDto;
  @ApiProperty({ type: [WeeklyDailyStatDto] }) dailyStats!: WeeklyDailyStatDto[];
}
