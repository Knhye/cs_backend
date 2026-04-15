import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
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

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('유저를 찾을 수 없습니다.');
      }

      const settings = await this.ensureSettings(userId);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImg: user.profileImg,
        createdAt: user.createdAt,
        settings: this.toSettingsDto(settings),
      };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        '서버 오류: 회원 정보를 조회할 수 없습니다.',
      );
    }
  }

  async updateSettings(
    userId: string,
    dto: UpdateSettingsDto,
  ): Promise<UserSettingsDto> {
    try {
      await this.ensureSettings(userId);

      const updated = await this.prisma.userSettings.update({
        where: { userId },
        data: {
          ...(dto.brightnessThreshold !== undefined && {
            brightnessThreshold: dto.brightnessThreshold,
          }),
          ...(dto.reportPushEnabled !== undefined && {
            reportPushEnabled: dto.reportPushEnabled,
          }),
          ...(dto.reportPushWay !== undefined && {
            reportPushWay: dto.reportPushWay,
          }),
          ...(dto.pushEnabled !== undefined && { pushEnabled: dto.pushEnabled }),
          ...(dto.soundEnabled !== undefined && {
            soundEnabled: dto.soundEnabled,
          }),
        },
      });

      return this.toSettingsDto(updated);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        '서버 오류: 설정을 수정할 수 없습니다.',
      );
    }
  }

  async updateDarkDetection(
    userId: string,
    dto: UpdateDarkDetectionDto,
  ): Promise<DarkDetectionResponseDto> {
    try {
      await this.ensureSettings(userId);

      const updated = await this.prisma.userSettings.update({
        where: { userId },
        data: { darkDetectionEnabled: dto.enabled },
        select: { darkDetectionEnabled: true },
      });

      return { darkDetectionEnabled: updated.darkDetectionEnabled };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        '서버 오류: 어둠 감지 설정을 수정할 수 없습니다.',
      );
    }
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('유저를 찾을 수 없습니다.');
      }

      if (!user.password) {
        throw new BadRequestException(
          '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.',
        );
      }

      const isValid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isValid) {
        throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
      }

      if (dto.currentPassword === dto.newPassword) {
        throw new BadRequestException(
          '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
        );
      }

      const hashed = await bcrypt.hash(dto.newPassword, 10);

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { password: hashed },
        }),
        this.prisma.refreshToken.deleteMany({ where: { userId } }),
      ]);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        '서버 오류: 비밀번호를 변경할 수 없습니다.',
      );
    }
  }

  private async ensureSettings(userId: string) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  private toSettingsDto(settings: {
    brightnessThreshold: number;
    darkDetectionEnabled: boolean;
    reportPushEnabled: boolean;
    reportPushWay: UserSettingsDto['reportPushWay'];
    pushEnabled: boolean;
    soundEnabled: boolean;
  }): UserSettingsDto {
    return {
      brightnessThreshold: settings.brightnessThreshold,
      darkDetectionEnabled: settings.darkDetectionEnabled,
      reportPushEnabled: settings.reportPushEnabled,
      reportPushWay: settings.reportPushWay,
      pushEnabled: settings.pushEnabled,
      soundEnabled: settings.soundEnabled,
    };
  }
}
