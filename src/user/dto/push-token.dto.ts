import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterPushTokenDto {
  @ApiProperty({ description: 'FCM 등록 토큰', example: 'fcm-token-string' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: '플랫폼', enum: ['web'], example: 'web' })
  @IsIn(['web'])
  platform: 'web';

  @ApiProperty({ description: '기기 고유 식별자', example: 'device-uuid' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiPropertyOptional({ description: 'User-Agent 문자열' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
