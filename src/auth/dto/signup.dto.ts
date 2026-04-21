import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
} from 'class-validator';

const PASSWORD_REGEX = /^[a-zA-Z0-9!@#%^*()\-_=+\[\]{}.,]+$/;
const PASSWORD_REGEX_MESSAGE =
  '비밀번호에 사용할 수 없는 특수문자가 포함되어 있습니다. 허용 특수문자: !@#%^*()-_=+[]{}.,';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수입니다.' })
  email!: string;

  @ApiProperty({
    example: 'password123!',
    description: '비밀번호 (최소 8자, 영문·숫자·허용 특수문자만 사용 가능)',
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_REGEX_MESSAGE })
  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  password!: string;

  @ApiProperty({ example: '홍길동', description: '이름' })
  @IsString()
  @IsNotEmpty({ message: '이름은 필수입니다.' })
  name!: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/.../profile.jpg',
    description: '프로필 이미지 URL (S3/Cloudinary 업로드 후 URL)',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이 아닙니다.' })
  profileImg?: string;
}
