import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendEmailCodeDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수입니다.' })
  email!: string;
}
