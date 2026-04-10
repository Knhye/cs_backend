import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class VerifyEmailCodeDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수입니다.' })
  email!: string;

  @ApiProperty({ example: '123456', description: '6자리 인증 코드' })
  @IsNotEmpty({ message: '인증 코드는 필수입니다.' })
  @Length(6, 6, { message: '인증 코드는 6자리여야 합니다.' })
  code!: string;
}
