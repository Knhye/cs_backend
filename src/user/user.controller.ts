import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponse } from '../common/decorators/api-common-response.decorator.js';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import {
  DarkDetectionResponseDto,
  UpdateDarkDetectionDto,
} from './dto/update-dark-detection.dto.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import {
  UserResponseDto,
  UserSettingsDto,
} from './dto/user-response.dto.js';
import { UserService } from './user.service.js';

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiCommonResponse({ type: UserResponseDto })
  async getMe(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserResponseDto> {
    return this.userService.getMe(user.id);
  }

  @Patch('me/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '사용자 설정 수정 (어둠 감지 제외)' })
  @ApiCommonResponse({ type: UserSettingsDto })
  async updateSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateSettingsDto,
  ): Promise<UserSettingsDto> {
    return this.userService.updateSettings(user.id, dto);
  }

  @Patch('me/dark-detection')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '어둠 감지 모드 토글' })
  @ApiCommonResponse({ type: DarkDetectionResponseDto })
  async updateDarkDetection(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateDarkDetectionDto,
  ): Promise<DarkDetectionResponseDto> {
    return this.userService.updateDarkDetection(user.id, dto);
  }

  @Patch('me/password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiCommonResponse({ description: '비밀번호 변경 성공' })
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<null> {
    await this.userService.changePassword(user.id, dto);
    return null;
  }
}
