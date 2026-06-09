import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

const PASSWORD_REGEX = /^[a-zA-Z0-9!@#%^*()\-_=+[\]{}.,]+$/;
const PASSWORD_REGEX_MESSAGE =
  '비밀번호에 사용할 수 없는 특수문자가 포함되어 있습니다. 허용 특수문자: !@#%^*()-_=+[]{}.,';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123', description: '현재 비밀번호' })
  @IsString()
  @IsNotEmpty({ message: '현재 비밀번호는 필수입니다.' })
  currentPassword!: string;

  @ApiProperty({
    example: 'newPassword456!',
    description: '새 비밀번호 (최소 8자, 영문·숫자·허용 특수문자만 사용 가능)',
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_REGEX_MESSAGE })
  @IsNotEmpty({ message: '새 비밀번호는 필수입니다.' })
  newPassword!: string;
}
