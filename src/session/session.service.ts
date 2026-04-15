import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DetectionType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { EndSessionDto } from './dto/end-session.dto.js';
import {
  CurrentSessionResponseDto,
  NewBadgeDto,
  SessionEndResponseDto,
  SessionStartResponseDto,
  UploadEventsResponseDto,
} from './dto/session-response.dto.js';
import { StartSessionDto } from './dto/start-session.dto.js';
import { UploadEventsDto } from './dto/upload-events.dto.js';

interface AggregateBuckets {
  goodPostureSec: number;
  goodPostureCount: number;
  turtleNeckSec: number;
  turtleNeckCount: number;
  shoulderIssueSec: number;
  shoulderIssueCount: number;
  darkEnvSec: number;
  darkEnvCount: number;
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async start(
    userId: string,
    dto: StartSessionDto,
  ): Promise<SessionStartResponseDto> {
    try {
      const active = await this.prisma.detectionSession.findFirst({
        where: { userId, endedAt: null },
      });
      if (active) {
        throw new ConflictException('이미 진행 중인 세션이 존재합니다.');
      }

      const session = await this.prisma.detectionSession.create({
        data: {
          userId,
          startedAt: new Date(dto.startedAt),
        },
      });

      return { sessionId: session.id, startedAt: session.startedAt };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        '서버 오류: 세션을 시작할 수 없습니다.',
      );
    }
  }

  async end(
    userId: string,
    sessionId: string,
    dto: EndSessionDto,
  ): Promise<SessionEndResponseDto> {
    try {
      const session = await this.prisma.detectionSession.findUnique({
        where: { id: sessionId },
      });
      if (!session) {
        throw new NotFoundException('세션을 찾을 수 없습니다.');
      }
      if (session.userId !== userId) {
        throw new ForbiddenException('해당 세션에 접근할 수 없습니다.');
      }
      if (session.endedAt) {
        throw new ConflictException('이미 종료된 세션입니다.');
      }

      const endedAt = new Date(dto.endedAt);
      const totalDurationSec = Math.max(
        0,
        Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000),
      );

      const buckets = await this.aggregateBySession(sessionId);
      const healthScore = this.computeHealthScore(
        buckets.goodPostureSec,
        totalDurationSec,
      );

      const seoulDate = this.toSeoulDate(endedAt);

      await this.prisma.$transaction([
        this.prisma.detectionSession.update({
          where: { id: sessionId },
          data: {
            endedAt,
            totalDurationSec,
            goodPostureSec: buckets.goodPostureSec,
            turtleNeckSec: buckets.turtleNeckSec,
            shoulderIssueSec: buckets.shoulderIssueSec,
            darkEnvSec: buckets.darkEnvSec,
            goodPostureCount: buckets.goodPostureCount,
            turtleNeckCount: buckets.turtleNeckCount,
            shoulderIssueCount: buckets.shoulderIssueCount,
            darkEnvCount: buckets.darkEnvCount,
            healthScore,
          },
        }),
        this.prisma.dailyStat.upsert({
          where: { userId_date: { userId, date: seoulDate } },
          create: {
            userId,
            date: seoulDate,
            totalDetectionSec: totalDurationSec,
            goodPostureSec: buckets.goodPostureSec,
            turtleNeckSec: buckets.turtleNeckSec,
            shoulderIssueSec: buckets.shoulderIssueSec,
            darkEnvSec: buckets.darkEnvSec,
            goodPostureCount: buckets.goodPostureCount,
            turtleNeckCount: buckets.turtleNeckCount,
            shoulderIssueCount: buckets.shoulderIssueCount,
            darkEnvCount: buckets.darkEnvCount,
            healthScore,
          },
          update: {
            totalDetectionSec: { increment: totalDurationSec },
            goodPostureSec: { increment: buckets.goodPostureSec },
            turtleNeckSec: { increment: buckets.turtleNeckSec },
            shoulderIssueSec: { increment: buckets.shoulderIssueSec },
            darkEnvSec: { increment: buckets.darkEnvSec },
            goodPostureCount: { increment: buckets.goodPostureCount },
            turtleNeckCount: { increment: buckets.turtleNeckCount },
            shoulderIssueCount: { increment: buckets.shoulderIssueCount },
            darkEnvCount: { increment: buckets.darkEnvCount },
          },
        }),
      ]);

      await this.recomputeDailyHealthScore(userId, seoulDate);

      const newBadges = await this.evaluateNewBadges();

      return {
        sessionId,
        totalDurationSec,
        goodPostureSec: buckets.goodPostureSec,
        turtleNeckSec: buckets.turtleNeckSec,
        shoulderIssueSec: buckets.shoulderIssueSec,
        darkEnvSec: buckets.darkEnvSec,
        goodPostureCount: buckets.goodPostureCount,
        turtleNeckCount: buckets.turtleNeckCount,
        shoulderIssueCount: buckets.shoulderIssueCount,
        darkEnvCount: buckets.darkEnvCount,
        healthScore,
        newBadges,
      };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        '서버 오류: 세션을 종료할 수 없습니다.',
      );
    }
  }

  async uploadEvents(
    userId: string,
    sessionId: string,
    dto: UploadEventsDto,
  ): Promise<UploadEventsResponseDto> {
    try {
      const session = await this.prisma.detectionSession.findUnique({
        where: { id: sessionId },
      });
      if (!session) {
        throw new NotFoundException('세션을 찾을 수 없습니다.');
      }
      if (session.userId !== userId) {
        throw new ForbiddenException('해당 세션에 접근할 수 없습니다.');
      }
      if (session.endedAt) {
        throw new ConflictException('종료된 세션에는 이벤트를 추가할 수 없습니다.');
      }

      const data: Prisma.DetectionEventCreateManyInput[] = dto.events.map((e) => ({
        sessionId,
        userId,
        type: e.type,
        severity: e.severity,
        durationSec: e.durationSec,
        detectedAt: new Date(e.detectedAt),
      }));

      const result = await this.prisma.detectionEvent.createMany({ data });

      return { accepted: result.count };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        '서버 오류: 이벤트를 저장할 수 없습니다.',
      );
    }
  }

  async getCurrent(userId: string): Promise<CurrentSessionResponseDto | null> {
    try {
      const session = await this.prisma.detectionSession.findFirst({
        where: { userId, endedAt: null },
        orderBy: { startedAt: 'desc' },
      });
      if (!session) return null;
      return { sessionId: session.id, startedAt: session.startedAt };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        '서버 오류: 세션 정보를 조회할 수 없습니다.',
      );
    }
  }

  private async aggregateBySession(sessionId: string): Promise<AggregateBuckets> {
    const grouped = await this.prisma.detectionEvent.groupBy({
      by: ['type'],
      where: { sessionId },
      _sum: { durationSec: true },
      _count: { _all: true },
    });

    const buckets: AggregateBuckets = {
      goodPostureSec: 0,
      goodPostureCount: 0,
      turtleNeckSec: 0,
      turtleNeckCount: 0,
      shoulderIssueSec: 0,
      shoulderIssueCount: 0,
      darkEnvSec: 0,
      darkEnvCount: 0,
    };

    for (const row of grouped) {
      const sec = row._sum.durationSec ?? 0;
      const count = row._count._all;
      switch (row.type) {
        case DetectionType.GOOD_POSTURE:
          buckets.goodPostureSec += sec;
          buckets.goodPostureCount += count;
          break;
        case DetectionType.TURTLE_NECK:
          buckets.turtleNeckSec += sec;
          buckets.turtleNeckCount += count;
          break;
        case DetectionType.ROUND_SHOULDER:
        case DetectionType.SHOULDER_ASYMMETRY:
          buckets.shoulderIssueSec += sec;
          buckets.shoulderIssueCount += count;
          break;
        case DetectionType.DARK_ENV:
          buckets.darkEnvSec += sec;
          buckets.darkEnvCount += count;
          break;
      }
    }

    return buckets;
  }

  private computeHealthScore(
    goodPostureSec: number,
    totalDurationSec: number,
  ): number | null {
    if (totalDurationSec <= 0) return null;
    const ratio = goodPostureSec / totalDurationSec;
    return Math.max(0, Math.min(100, Math.round(ratio * 100)));
  }

  private async recomputeDailyHealthScore(
    userId: string,
    date: Date,
  ): Promise<void> {
    const stat = await this.prisma.dailyStat.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (!stat) return;
    const score = this.computeHealthScore(
      stat.goodPostureSec,
      stat.totalDetectionSec,
    );
    if (score !== stat.healthScore) {
      await this.prisma.dailyStat.update({
        where: { userId_date: { userId, date } },
        data: { healthScore: score },
      });
    }
  }

  private toSeoulDate(date: Date): Date {
    const seoul = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    return new Date(
      Date.UTC(
        seoul.getUTCFullYear(),
        seoul.getUTCMonth(),
        seoul.getUTCDate(),
      ),
    );
  }

  private async evaluateNewBadges(): Promise<NewBadgeDto[]> {
    return [];
  }
}
