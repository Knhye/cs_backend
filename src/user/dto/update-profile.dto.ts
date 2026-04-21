import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: '이름 (1~50자)',
    example: '홍길동',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '이름은 최소 1자 이상이어야 합니다.' })
  @MaxLength(50, { message: '이름은 최대 50자까지 가능합니다.' })
  name?: string;

  @ApiProperty({
    description: '프로필 이미지 URL (null 전달 시 삭제)',
    example: 'https://cdn.example.com/me.jpg',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @ValidateIf((o: UpdateProfileDto) => o.profileImg !== null)
  @IsUrl({}, { message: '올바른 URL 형식이 아닙니다.' })
  profileImg?: string | null;
}

export class UpdateProfileResponseDto {
  @ApiProperty({ description: '유저 ID' })
  id!: string;

  @ApiProperty({ description: '이름' })
  name!: string;

  @ApiProperty({ description: '프로필 이미지 URL', nullable: true })
  profileImg!: string | null;
}
