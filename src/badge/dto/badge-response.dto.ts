import { ApiProperty } from '@nestjs/swagger';

export class BadgeDto {
  @ApiProperty({ description: '배지 ID' })
  id!: string;

  @ApiProperty({ description: '배지 코드', example: 'POSTURE_30M' })
  code!: string;

  @ApiProperty({ description: '배지 이름', example: '30분 집중' })
  name!: string;

  @ApiProperty({ description: '배지 설명', example: '30분 이상 바른 자세 유지' })
  description!: string;

  @ApiProperty({
    description: '카테고리',
    enum: ['POSTURE_TIME', 'STREAK', 'SPECIAL'],
    example: 'POSTURE_TIME',
  })
  category!: string;

  @ApiProperty({ description: '아이콘 URL', nullable: true, example: 'https://...' })
  iconUrl!: string | null;

  @ApiProperty({ description: '달성 조건값', example: 1800 })
  requirementValue!: number;
}

export class MyBadgeDto {
  @ApiProperty({ description: '배지 ID' })
  badgeId!: string;

  @ApiProperty({ description: '배지 코드', example: 'POSTURE_30M' })
  code!: string;

  @ApiProperty({ description: '배지 이름', example: '30분 집중' })
  name!: string;

  @ApiProperty({ description: '획득 일시', example: '2026-04-05T10:20:00.000Z' })
  earnedAt!: Date;

  @ApiProperty({ description: '아이콘 URL', nullable: true, example: 'https://...' })
  iconUrl!: string | null;
}
