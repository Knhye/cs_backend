import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DeliveryWay, DetectionType, ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReportHistoryQueryDto } from './dto/report-query.dto.js';
import {
  CurrentReportResponseDto,
  ReportDetailResponseDto,
  ReportHistoryItemDto,
  ReportHistoryResponseDto,
  ReportSessionDto,
  ReportTimelineItemDto,
  ResendResponseDto,
  TopIssueDto,
} from './dto/report-response.dto.js';
import {
  addDays,
  currentSeoulWeekRange,
  formatDate,
  parseDate,
  seoulDayStartUtc,
  seoulHourMinute,
  toSeoulDate,
} from '../common/utils/date.util.js';
import { rethrowAsInternal } from '../common/utils/error.util.js';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getReportHistory(
    userId: string,
    query: ReportHistoryQueryDto,
  ): Promise<ReportHistoryResponseDto> {
    try {
      const weekStartDateFilter: { gte?: Date; lte?: Date } = {};
      if (query.from) weekStartDateFilter.gte = parseDate(query.from) ?? undefined;
      if (query.to) weekStartDateFilter.lte = parseDate(query.to) ?? undefined;

      const reports = await this.prisma.weeklyReport.findMany({
        where: {
          userId,
          ...(Object.keys(weekStartDateFilter).length > 0 && {
            weekStartDate: weekStartDateFilter,
          }),
        },
        orderBy: { weekStartDate: 'desc' },
        select: {
          id: true,
          weekStartDate: true,
          weekEndDate: true,
          deliveryWay: true,
          status: true,
          sentAt: true,
        },
      });

      const items: ReportHistoryItemDto[] = reports.map((r) => ({
        id: r.id,
        weekStartDate: formatDate(r.weekStartDate),
        weekEndDate: formatDate(r.weekEndDate),
        deliveryWay: r.deliveryWay,
        status: r.status,
        sentAt: r.sentAt,
      }));

      return { items };
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 리포트 이력을 조회할 수 없습니다.');
    }
  }

  async getReportById(
    userId: string,
    id: string,
  ): Promise<ReportDetailResponseDto> {
    try {
      const report = await this.prisma.weeklyReport.findUnique({
        where: { id },
      });
      if (!report) throw new NotFoundException('리포트를 찾을 수 없습니다.');
      if (report.userId !== userId)
        throw new ForbiddenException('접근 권한이 없습니다.');

      const payload = report.payload as unknown as CurrentReportResponseDto;
      return {
        ...payload,
        id: report.id,
        deliveryWay: report.deliveryWay,
        sentAt: report.sentAt,
        status: report.status,
      };
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 리포트를 조회할 수 없습니다.');
    }
  }

  async resendReport(userId: string, id: string): Promise<ResendResponseDto> {
    try {
      const report = await this.prisma.weeklyReport.findUnique({
        where: { id },
      });
      if (!report) throw new NotFoundException('리포트를 찾을 수 없습니다.');
      if (report.userId !== userId)
        throw new ForbiddenException('접근 권한이 없습니다.');
      if (report.status === ReportStatus.SENT)
        throw new ConflictException('이미 발송된 리포트입니다.');

      await this.prisma.weeklyReport.update({
        where: { id },
        data: { status: ReportStatus.PENDING, errorMessage: null },
      });

      this.deliverReport(id).catch(() => {});

      return { id, status: ReportStatus.PENDING };
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 리포트 재발송에 실패했습니다.');
    }
  }

  /** 매주 월요일 00:00 KST (= 일요일 15:00 UTC) — 전주 리포트 생성 및 발송 */
  @Cron('0 15 * * 0')
  async generateWeeklyReports(): Promise<void> {
    const { weekStart: currentWeekStart } = currentSeoulWeekRange();
    const weekStart = addDays(currentWeekStart, -7);
    const weekEnd = addDays(weekStart, 6);

    const users = await this.prisma.user.findMany({
      where: { userSettings: { reportPushEnabled: true } },
      include: { userSettings: true },
    });

    for (const user of users) {
      if (!user.userSettings) continue;
      const deliveryWay =
        user.userSettings.reportPushWay === 'EMAIL'
          ? DeliveryWay.EMAIL
          : DeliveryWay.NOTION;

      try {
        const payload = await this.buildPayload(user.id, weekStart, weekEnd);

        const report = await this.prisma.weeklyReport.upsert({
          where: {
            userId_weekStartDate_deliveryWay: {
              userId: user.id,
              weekStartDate: weekStart,
              deliveryWay,
            },
          },
          update: {
            status: ReportStatus.PENDING,
            payload: payload as object,
            errorMessage: null,
          },
          create: {
            userId: user.id,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            deliveryWay,
            status: ReportStatus.PENDING,
            payload: payload as object,
          },
        });

        await this.deliverReport(report.id);
      } catch {
        // 개별 유저 실패가 전체 스케줄을 중단하지 않도록 흡수
      }
    }
  }

  private async deliverReport(reportId: string): Promise<void> {
    try {
      // TODO: deliveryWay(EMAIL/NOTION)에 따른 실제 발송 로직 구현
      await this.prisma.weeklyReport.update({
        where: { id: reportId },
        data: { status: ReportStatus.SENT, sentAt: new Date() },
      });
    } catch (e) {
      await this.prisma.weeklyReport
        .update({
          where: { id: reportId },
          data: {
            status: ReportStatus.FAILED,
            errorMessage: e instanceof Error ? e.message : '알 수 없는 오류',
          },
        })
        .catch(() => {});
    }
  }

  async buildPayload(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<CurrentReportResponseDto> {
    const weekEndExclusive = addDays(weekEnd, 1);

    const [dailyStats, sessions, events] = await Promise.all([
      this.prisma.dailyStat.findMany({
        where: { userId, date: { gte: weekStart, lte: weekEnd } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.detectionSession.findMany({
        where: {
          userId,
          startedAt: {
            gte: seoulDayStartUtc(weekStart),
            lt: seoulDayStartUtc(weekEndExclusive),
          },
          endedAt: { not: null },
        },
        select: { startedAt: true, endedAt: true, totalDurationSec: true },
      }),
      this.prisma.detectionEvent.findMany({
        where: {
          userId,
          detectedAt: {
            gte: seoulDayStartUtc(weekStart),
            lt: seoulDayStartUtc(weekEndExclusive),
          },
        },
        select: { type: true, durationSec: true, detectedAt: true },
      }),
    ]);

    // ─── session ───────────────────────────────────────────────────────────
    const session: ReportSessionDto = {
      firstStartedAt:
        sessions.length > 0
          ? sessions.reduce(
              (m, s) => (s.startedAt < m ? s.startedAt : m),
              sessions[0].startedAt,
            )
          : null,
      lastEndedAt:
        sessions.length > 0
          ? sessions.reduce<Date | null>((m, s) => {
              if (!s.endedAt) return m;
              if (!m) return s.endedAt;
              return s.endedAt > m ? s.endedAt : m;
            }, null)
          : null,
      totalDetectionSec: sessions.reduce((sum, s) => sum + s.totalDurationSec, 0),
    };

    // ─── health score ───────────────────────────────────────────────────────
    const dailyScoreMap = new Map(
      dailyStats.map((s) => [formatDate(s.date), s.healthScore]),
    );
    const daily: (number | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      daily.push(dailyScoreMap.get(formatDate(d)) ?? null);
    }
    const validScores = daily.filter((s): s is number => s !== null);
    const weeklyScore =
      validScores.length > 0
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : null;

    // ─── top issues ─────────────────────────────────────────────────────────
    const issueMap = new Map<string, { durationSec: number; count: number }>();
    for (const e of events) {
      if (e.type === DetectionType.GOOD_POSTURE) continue;
      const prev = issueMap.get(e.type) ?? { durationSec: 0, count: 0 };
      issueMap.set(e.type, {
        durationSec: prev.durationSec + e.durationSec,
        count: prev.count + 1,
      });
    }
    const topIssues: TopIssueDto[] = Array.from(issueMap.entries())
      .sort((a, b) => b[1].durationSec - a[1].durationSec)
      .slice(0, 3)
      .map(([type, stats], idx) => ({
        type,
        durationSec: stats.durationSec,
        count: stats.count,
        rank: idx + 1,
      }));

    // ─── timeline (30분 버킷, 데이터 있는 것만) ──────────────────────────────
    type BucketData = {
      good: number;
      turtleNeck: number;
      shoulder: number;
      dark: number;
    };
    const bucketMap = new Map<string, BucketData>();

    for (const e of events) {
      const { hour, minute } = seoulHourMinute(e.detectedAt);
      const dateStr = formatDate(toSeoulDate(e.detectedAt));
      const startMin = minute >= 30 ? 30 : 0;
      const key = `${dateStr}|${hour}|${startMin}`;
      const b = bucketMap.get(key) ?? {
        good: 0,
        turtleNeck: 0,
        shoulder: 0,
        dark: 0,
      };
      switch (e.type) {
        case DetectionType.GOOD_POSTURE:
          b.good += e.durationSec;
          break;
        case DetectionType.TURTLE_NECK:
          b.turtleNeck += e.durationSec;
          break;
        case DetectionType.ROUND_SHOULDER:
        case DetectionType.SHOULDER_ASYMMETRY:
          b.shoulder += e.durationSec;
          break;
        case DetectionType.DARK_ENV:
          b.dark += e.durationSec;
          break;
      }
      bucketMap.set(key, b);
    }

    const timeline: ReportTimelineItemDto[] = Array.from(bucketMap.entries())
      .map(([key, b]) => {
        const [date, hourStr, minStr] = key.split('|');
        const total = b.good + b.turtleNeck + b.shoulder + b.dark;
        const entries: Array<[string, number]> = [
          ['GOOD', b.good],
          ['TURTLE_NECK', b.turtleNeck],
          ['SHOULDER_ISSUE', b.shoulder],
          ['DARK_ENV', b.dark],
        ];
        const dominantState =
          total > 0
            ? entries.reduce((acc, cur) => (cur[1] > acc[1] ? cur : acc))[0]
            : null;
        const healthScore =
          total > 0
            ? Math.max(0, Math.min(100, Math.round((b.good / total) * 100)))
            : null;
        return {
          date,
          startHour: Number(hourStr),
          startMin: Number(minStr),
          dominantState,
          healthScore,
        };
      })
      .filter((t) => t.dominantState !== null)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        if (a.startHour !== b.startHour) return a.startHour - b.startHour;
        return a.startMin - b.startMin;
      });

    const topIssueType = (topIssues[0]?.type as DetectionType | undefined) ?? null;
    const aiSolution = this.generateAiSolution(topIssueType);

    return {
      weekStartDate: formatDate(weekStart),
      weekEndDate: formatDate(weekEnd),
      session,
      healthScore: { weekly: weeklyScore, daily },
      timeline,
      topIssues,
      aiSolution,
    };
  }

  private generateAiSolution(topIssueType: DetectionType | null): string {
    switch (topIssueType) {
      case DetectionType.TURTLE_NECK:
        return '거북목이 가장 빈번하게 나타났어요. 모니터 상단을 눈높이에 맞추고, 1시간마다 목 스트레칭을 해보세요.';
      case DetectionType.ROUND_SHOULDER:
        return '어깨 말림이 자주 감지되었어요. 어깨를 뒤로 젖히는 스트레칭과 가슴 근육 이완 운동을 추천합니다.';
      case DetectionType.SHOULDER_ASYMMETRY:
        return '어깨 비대칭이 반복해서 감지되었어요. 균형 잡힌 자세를 위해 양쪽 어깨 높이를 의식적으로 맞춰보세요.';
      case DetectionType.DARK_ENV:
        return '어두운 환경에서 장시간 화면을 보셨어요. 화면 밝기를 주변 환경에 맞게 조정하고, 블루라이트 필터 사용을 권장합니다.';
      default:
        return '이번 주 자세 상태를 분석했어요. 규칙적인 휴식과 스트레칭으로 건강한 자세를 유지해보세요.';
    }
  }
}
