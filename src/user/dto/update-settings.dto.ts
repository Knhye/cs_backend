import { ApiProperty } from '@nestjs/swagger';
import { ReportPushWay } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({
    description: '밝기 임계값 (0~255)',
    example: 80,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'brightnessThreshold는 정수여야 합니다.' })
  @Min(0, { message: 'brightnessThreshold는 0 이상이어야 합니다.' })
  @Max(255, { message: 'brightnessThreshold는 255 이하여야 합니다.' })
  brightnessThreshold?: number;

  @ApiProperty({ description: '리포트 수신 활성화', required: false })
  @IsOptional()
  @IsBoolean()
  reportPushEnabled?: boolean;

  @ApiProperty({
    description: '리포트 수신 방법',
    enum: ReportPushWay,
    required: false,
  })
  @IsOptional()
  @IsEnum(ReportPushWay, {
    message: 'reportPushWay는 NOTION 또는 EMAIL이어야 합니다.',
  })
  reportPushWay?: ReportPushWay;

  @ApiProperty({ description: '푸시 알림 활성화', required: false })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiProperty({ description: '소리 알림 활성화', required: false })
  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @ApiProperty({
    description: '아바타 후드 색상',
    example: 'default',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 32, {
    message: 'avatarHoodColor는 1~32자 사이여야 합니다.',
  })
  avatarHoodColor?: string;
}
