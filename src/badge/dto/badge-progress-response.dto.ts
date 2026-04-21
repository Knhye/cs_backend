import { ApiProperty } from '@nestjs/swagger';

export class NextBadgeDto {
  @ApiProperty({ description: '다음 배지 코드', example: 'POSTURE_1H' })
  code!: string;

  @ApiProperty({ description: '달성 조건값', example: 3600 })
  requirementValue!: number;

  @ApiProperty({ description: '남은 값', example: 900 })
  remaining!: number;
}

export class BadgeCategoryProgressDto {
  @ApiProperty({
    description: '카테고리',
    enum: ['POSTURE_TIME', 'STREAK'],
    example: 'POSTURE_TIME',
  })
  category!: string;

  @ApiProperty({ description: '현재 진행값', example: 2700 })
  current!: number;

  @ApiProperty({
    description: '다음 획득 가능 배지 (모두 획득 시 null)',
    nullable: true,
    type: NextBadgeDto,
  })
  next!: NextBadgeDto | null;
}

export class BadgeProgressResponseDto {
  @ApiProperty({ description: '카테고리별 진행도', type: [BadgeCategoryProgressDto] })
  categories!: BadgeCategoryProgressDto[];
}
