import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { BadgeCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { NewBadgeDto } from '../session/dto/session-response.dto.js';
import {
  BadgeCategoryProgressDto,
  BadgeProgressResponseDto,
  NextBadgeDto,
} from './dto/badge-progress-response.dto.js';
import { BadgeDto, MyBadgeDto } from './dto/badge-response.dto.js';

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class BadgeService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllBadges(): Promise<BadgeDto[]> {
    try {
      const badges = await this.prisma.badge.findMany({
        orderBy: [{ category: 'asc' }, { requirementValue: 'asc' }],
      });
      return badges.map((b) => ({
        id: b.id,
        code: b.code,
        name: b.name,
        description: b.description,
        category: b.category,
        iconUrl: b.iconUrl,
        requirementValue: b.requirementValue,
      }));
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        '서버 오류: 배지 목록을 조회할 수 없습니다.',
      );
    }
  }

  async getMyBadges(userId: string): Promise<MyBadgeDto[]> {
    try {
      const userBadges = await this.prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      });
      return userBadges.map((ub) => ({
        badgeId: ub.badgeId,
        code: ub.badge.code,
        name: ub.badge.name,
        earnedAt: ub.earnedAt,
        iconUrl: ub.badge.iconUrl,
      }));
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        '서버 오류: 내 배지를 조회할 수 없습니다.',
      );
    }
  }

  async getProgress(userId: string): Promise<BadgeProgressResponseDto> {
    try {
      const [earnedBadges, allBadges, statsResult] = await Promise.all([
        this.prisma.userBadge.findMany({
          where: { userId },
          select: { badgeId: true },
        }),
        this.prisma.badge.findMany({
          where: {
            category: { in: [BadgeCategory.POSTURE_TIME, BadgeCategory.STREAK] },
          },
          orderBy: { requirementValue: 'asc' },
        }),
        this.prisma.dailyStat.aggregate({
          where: { userId },
          _sum: { goodPostureSec: true },
        }),
      ]);

      const earnedIds = new Set(earnedBadges.map((e) => e.badgeId));
      const currentPostureSec = statsResult._sum.goodPostureSec ?? 0;
      const currentStreak = await this.computeStreak(userId);

      const categories: BadgeCategoryProgressDto[] = [];

      const postureNext = allBadges.find(
        (b) =>
          b.category === BadgeCategory.POSTURE_TIME && !earnedIds.has(b.id),
      );
      const postureNextDto: NextBadgeDto | null = postureNext
        ? {
            code: postureNext.code,
            requirementValue: postureNext.requirementValue,
            remaining: Math.max(
              0,
              postureNext.requirementValue - currentPostureSec,
            ),
          }
        : null;
      categories.push({
        category: 'POSTURE_TIME',
        current: currentPostureSec,
        next: postureNextDto,
      });

      const streakNext = allBadges.find(
        (b) => b.category === BadgeCategory.STREAK && !earnedIds.has(b.id),
      );
      const streakNextDto: NextBadgeDto | null = streakNext
        ? {
            code: streakNext.code,
            requirementValue: streakNext.requirementValue,
            remaining: Math.max(0, streakNext.requirementValue - currentStreak),
          }
        : null;
      categories.push({
        category: 'STREAK',
        current: currentStreak,
        next: streakNextDto,
      });

      return { categories };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        '서버 오류: 배지 진행도를 조회할 수 없습니다.',
      );
    }
  }

  async evaluateNewBadges(userId: string): Promise<NewBadgeDto[]> {
    try {
      const [earnedBadges, allBadges, statsResult] = await Promise.all([
        this.prisma.userBadge.findMany({
          where: { userId },
          select: { badgeId: true },
        }),
        this.prisma.badge.findMany(),
        this.prisma.dailyStat.aggregate({
          where: { userId },
          _sum: { goodPostureSec: true },
        }),
      ]);

      const earnedIds = new Set(earnedBadges.map((e) => e.badgeId));
      const currentPostureSec = statsResult._sum.goodPostureSec ?? 0;
      const currentStreak = await this.computeStreak(userId);

      const toAward: typeof allBadges = [];

      for (const badge of allBadges) {
        if (earnedIds.has(badge.id)) continue;

        let qualifies = false;
        switch (badge.category) {
          case BadgeCategory.POSTURE_TIME:
            qualifies = currentPostureSec >= badge.requirementValue;
            break;
          case BadgeCategory.STREAK:
            qualifies = currentStreak >= badge.requirementValue;
            break;
          case BadgeCategory.SPECIAL:
            qualifies = await this.checkSpecialBadge(
              userId,
              badge.code,
              badge.requirementValue,
            );
            break;
        }

        if (qualifies) toAward.push(badge);
      }

      if (toAward.length === 0) return [];

      await this.prisma.userBadge.createMany({
        data: toAward.map((b) => ({ userId, badgeId: b.id })),
        skipDuplicates: true,
      });

      return toAward.map((b) => ({ code: b.code, name: b.name }));
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        '서버 오류: 배지 부여에 실패했습니다.',
      );
    }
  }

  private async checkSpecialBadge(
    userId: string,
    code: string,
    requirementValue: number,
  ): Promise<boolean> {
    if (code === 'FIRST_SESSION') {
      const count = await this.prisma.detectionSession.count({
        where: { userId, endedAt: { not: null } },
      });
      return count >= requirementValue;
    }
    return false;
  }

  private async computeStreak(userId: string): Promise<number> {
    const stats = await this.prisma.dailyStat.findMany({
      where: { userId, totalDetectionSec: { gt: 0 } },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    if (stats.length === 0) return 0;

    const now = new Date(Date.now() + SEOUL_OFFSET_MS);
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const yesterday = new Date(today.getTime() - DAY_MS);

    const mostRecentTime = stats[0].date.getTime();
    if (
      mostRecentTime !== today.getTime() &&
      mostRecentTime !== yesterday.getTime()
    ) {
      return 0;
    }

    let streak = 0;
    let expected = new Date(mostRecentTime);

    for (const stat of stats) {
      if (stat.date.getTime() === expected.getTime()) {
        streak++;
        expected = new Date(expected.getTime() - DAY_MS);
      } else {
        break;
      }
    }

    return streak;
  }
}
