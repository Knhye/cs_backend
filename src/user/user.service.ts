import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DetectionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  AvatarStateQueryDto,
  AvatarStateResponseDto,
  SymptomSummaryDto,
} from './dto/avatar-state.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import {
  DarkDetectionResponseDto,
  UpdateDarkDetectionDto,
} from './dto/update-dark-detection.dto.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import {
  UpdateProfileDto,
  UpdateProfileResponseDto,
} from './dto/update-profile.dto.js';
import {
  UserResponseDto,
  UserSettingsDto,
} from './dto/user-response.dto.js';
import { rethrowAsInternal } from '../common/utils/error.util.js';
import { RegisterPushTokenDto } from './dto/push-token.dto.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { userSettings: true },
      });

      if (!user) {
        throw new NotFoundException('유저를 찾을 수 없습니다.');
      }

      const settings = user.userSettings ?? await this.ensureSettings(userId);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImg: user.profileImg,
        createdAt: user.createdAt,
        settings: this.toSettingsDto(settings),
      };
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 회원 정보를 조회할 수 없습니다.');
    }
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    try {
      if (dto.name === undefined && dto.profileImg === undefined) {
        throw new BadRequestException('수정할 항목을 하나 이상 입력해 주세요.');
      }

      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.profileImg !== undefined && { profileImg: dto.profileImg }),
        },
        select: { id: true, name: true, profileImg: true },
      });

      return updated;
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 프로필을 수정할 수 없습니다.');
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
          ...(dto.avatarHoodColor !== undefined && {
            avatarHoodColor: dto.avatarHoodColor,
          }),
        },
      });

      return this.toSettingsDto(updated);
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 설정을 수정할 수 없습니다.');
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
      rethrowAsInternal(e, '서버 오류: 어둠 감지 설정을 수정할 수 없습니다.');
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
      rethrowAsInternal(e, '서버 오류: 비밀번호를 변경할 수 없습니다.');
    }
  }

  async getAvatarState(
    userId: string,
    query: AvatarStateQueryDto,
  ): Promise<AvatarStateResponseDto> {
    try {
      const windowSec = query.windowSec ?? 60;
      const now = new Date();
      const since = new Date(now.getTime() - windowSec * 1000);

      const [grouped, settings] = await Promise.all([
        this.prisma.detectionEvent.groupBy({
          by: ['type'],
          where: {
            userId,
            detectedAt: { gte: since, lte: now },
            type: { not: DetectionType.GOOD_POSTURE },
          },
          _sum: { durationSec: true },
          _count: { _all: true },
          _max: { severity: true },
        }),
        this.ensureSettings(userId),
      ]);

      const symptoms: SymptomSummaryDto[] = grouped
        .map((g) => ({
          type: g.type,
          severity: g._max.severity ?? 1,
          durationSec: g._sum.durationSec ?? 0,
          count: g._count._all,
        }))
        .sort((a, b) => b.durationSec - a.durationSec);

      const dominant = symptoms[0] ?? null;

      return {
        windowSec,
        dominantSymptom: dominant ? dominant.type : null,
        severity: dominant ? dominant.severity : null,
        symptoms,
        avatarHoodColor: settings.avatarHoodColor,
      };
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 아바타 상태를 조회할 수 없습니다.');
    }
  }

  async registerPushToken(
    userId: string,
    dto: RegisterPushTokenDto,
  ): Promise<void> {
    try {
      await this.prisma.pushToken.upsert({
        where: { userId_deviceId: { userId, deviceId: dto.deviceId } },
        update: { token: dto.token, userAgent: dto.userAgent ?? null },
        create: {
          userId,
          token: dto.token,
          platform: dto.platform,
          deviceId: dto.deviceId,
          userAgent: dto.userAgent ?? null,
        },
      });
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 푸시 토큰을 등록할 수 없습니다.');
    }
  }

  async removePushToken(userId: string, deviceId: string): Promise<void> {
    try {
      await this.prisma.pushToken.deleteMany({ where: { userId, deviceId } });
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 푸시 토큰을 삭제할 수 없습니다.');
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
    avatarHoodColor: string;
  }): UserSettingsDto {
    return {
      brightnessThreshold: settings.brightnessThreshold,
      darkDetectionEnabled: settings.darkDetectionEnabled,
      reportPushEnabled: settings.reportPushEnabled,
      reportPushWay: settings.reportPushWay,
      pushEnabled: settings.pushEnabled,
      soundEnabled: settings.soundEnabled,
      avatarHoodColor: settings.avatarHoodColor,
    };
  }
}
