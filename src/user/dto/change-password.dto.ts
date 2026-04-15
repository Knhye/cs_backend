import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123', description: '현재 비밀번호' })
  @IsString()
  @IsNotEmpty({ message: '현재 비밀번호는 필수입니다.' })
  currentPassword!: string;

  @ApiProperty({
    example: 'newPassword456',
    description: '새 비밀번호 (최소 6자)',
  })
  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  @IsNotEmpty({ message: '새 비밀번호는 필수입니다.' })
  newPassword!: string;
}
