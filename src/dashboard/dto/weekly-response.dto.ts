import { ApiProperty } from '@nestjs/swagger';

export class WeeklyDailyStatDto {
  @ApiProperty({ example: '2026-06-09' }) date!: string;
  @ApiProperty() hasData!: boolean;
  @ApiProperty() totalDetectionSec!: number;
  @ApiProperty() goodPostureSec!: number;
  @ApiProperty() turtleNeckSec!: number;
  @ApiProperty() roundShoulderSec!: number;
  @ApiProperty() shoulderAsymmetrySec!: number;
  @ApiProperty() darkEnvSec!: number;
  @ApiProperty() unclassifiedSec!: number;
  @ApiProperty({ description: '정자세 비율 (0.0~1.0)' }) goodPostureRatio!: number;
  @ApiProperty({ description: '불량 자세 비율 (0.0~1.0), badPostureSec = turtle+round+asymmetry' }) badPostureRatio!: number;
}

export class WeeklyDashboardDto {
  @ApiProperty({ description: '주 시작일 (월요일)', example: '2026-06-08' }) weekStartDate!: string;
  @ApiProperty({ description: '주 종료일 (일요일)', example: '2026-06-14' }) weekEndDate!: string;
  @ApiProperty({ type: [WeeklyDailyStatDto] }) dailyStats!: WeeklyDailyStatDto[];
}
