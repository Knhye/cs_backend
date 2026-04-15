import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateDarkDetectionDto {
  @ApiProperty({ description: '어둠 감지 활성화 여부', example: true })
  @IsBoolean()
  enabled!: boolean;
}

export class DarkDetectionResponseDto {
  @ApiProperty({ description: '어둠 감지 활성화 여부', example: true })
  darkDetectionEnabled!: boolean;
}
