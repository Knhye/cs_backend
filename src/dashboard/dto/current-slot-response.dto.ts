import { ApiProperty } from '@nestjs/swagger';

export class CurrentSlotDto {
  @ApiProperty({ description: '슬롯 인덱스 (0~7)', example: 3 })
  slotIndex!: number;

  @ApiProperty({ description: '슬롯 시작 시각 (서울 기준)', example: 9 })
  startHour!: number;

  @ApiProperty({ description: '슬롯 종료 시각 (서울 기준)', example: 12 })
  endHour!: number;

  @ApiProperty({ description: 'GOOD_POSTURE 감지 횟수' })
  goodPostureCount!: number;

  @ApiProperty({ description: '거북목 감지 횟수' })
  turtleNeckCount!: number;

  @ApiProperty({ description: '라운드숄더 감지 횟수' })
  roundShoulderCount!: number;

  @ApiProperty({ description: '어깨 비대칭 감지 횟수' })
  shoulderAsymmetryCount!: number;

  @ApiProperty({ description: '어두운 환경 감지 횟수' })
  darkEnvCount!: number;
}
