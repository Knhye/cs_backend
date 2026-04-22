import { ApiProperty } from '@nestjs/swagger';

export class TodayHealthScoreDto {
  @ApiProperty({ description: '오늘 일자(YYYY-MM-DD, Asia/Seoul)', example: '2026-04-22' })
  date!: string;

  @ApiProperty({ description: '자세 점수 (0~100)', nullable: true, example: 82 })
  postureScore!: number | null;

  @ApiProperty({ description: '경고 횟수 (모든 자세 경고 합산)', example: 15 })
  warningCount!: number;

  @ApiProperty({ description: '어제 대비 건강 점수 변화율(%)', nullable: true, example: 5.3 })
  vsYesterday!: number | null;

  @ApiProperty({ description: '지난주 같은 요일 대비 건강 점수 변화율(%)', nullable: true, example: -2.1 })
  vsLastWeek!: number | null;
}
