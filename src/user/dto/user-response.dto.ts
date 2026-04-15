import { ApiProperty } from '@nestjs/swagger';
import { ReportPushWay } from '@prisma/client';

export class UserSettingsDto {
  @ApiProperty({ description: '밝기 임계값 (0~255)', example: 50 })
  brightnessThreshold: number;

  @ApiProperty({ description: '어둠 감지 활성화' })
  darkDetectionEnabled: boolean;

  @ApiProperty({ description: '리포트 수신 활성화' })
  reportPushEnabled: boolean;

  @ApiProperty({
    description: '리포트 수신 방법',
    enum: ReportPushWay,
    example: ReportPushWay.EMAIL,
  })
  reportPushWay: ReportPushWay;

  @ApiProperty({ description: '푸시 알림 활성화' })
  pushEnabled: boolean;

  @ApiProperty({ description: '소리 알림 활성화' })
  soundEnabled: boolean;
}

export class UserResponseDto {
  @ApiProperty({ description: '유저 ID' })
  id: string;

  @ApiProperty({ description: '이메일' })
  email: string;

  @ApiProperty({ description: '이름' })
  name: string;

  @ApiProperty({ description: '프로필 이미지', nullable: true })
  profileImg: string | null;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '사용자 설정', type: UserSettingsDto })
  settings: UserSettingsDto;
}
