import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { DetectionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CurrentSlotDto } from './dto/current-slot-response.dto.js';
import {
  CreateTimelineEntryDto,
  CreateTimelineEntryResponseDto,
} from './dto/timeline-create.dto.js';
import {
  TimelineBucketDto,
  TimelineDashboardDto,
} from './dto/timeline-response.dto.js';
import { TodayHealthScoreDto } from './dto/today-response.dto.js';
import { WEEKDAY_VALUES, Weekday } from '../common/enums/weekday.enum.js';
import {
  WeeklyBreakdownDto,
  WeeklyDailyStatDto,
  WeeklyDashboardDto,
} from './dto/weekly-response.dto.js';
import {
  addDays,
  formatDate,
  parseDate,
  seoulDayStartUtc,
  seoulHour,
  todaySeoulDate,
} from '../common/utils/date.util.js';
import { rethrowAsInternal } from '../common/utils/error.util.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayHealthScore(userId: string): Promise<TodayHealthScoreDto> {
    try {
      const today = todaySeoulDate();
      const yesterday = addDays(today, -1);
      const lastWeekSameDay = addDays(today, -7);

      const [todayStat, yesterdayStat, lastWeekStat] = await Promise.all([
        this.prisma.dailyStat.findUnique({ where: { userId_date: { userId, date: today } } }),
        this.prisma.dailyStat.findUnique({ where: { userId_date: { userId, date: yesterday } } }),
        this.prisma.dailyStat.findUnique({ where: { userId_date: { userId, date: lastWeekSameDay } } }),
      ]);

      const postureScore = todayStat?.postureScore ?? null;
      const warningCount = todayStat?.warningCount ?? 0;

      return {
        date: formatDate(today),
        postureScore,
        warningCount,
        vsYesterday: this.calcPctChange(postureScore, yesterdayStat?.postureScore ?? null),
        vsLastWeek: this.calcPctChange(postureScore, lastWeekStat?.postureScore ?? null),
      };
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 오늘의 건강 점수를 조회할 수 없습니다.');
    }
  }

  async getWeekly(
    userId: string,
    fromStr: string,
  ): Promise<WeeklyDashboardDto> {
    try {
      const from = parseDate(fromStr);
      if (!from) {
        throw new BadRequestException('from은 YYYY-MM-DD 형식이어야 합니다.');
      }
      if (from.getUTCDay() !== 1) {
        throw new BadRequestException('from은 월요일이어야 합니다.');
      }
      const to = addDays(from, 6);

      const stats = await this.prisma.dailyStat.findMany({
        where: { userId, date: { gte: from, lte: to } },
      });
      const byDate = new Map(stats.map((s) => [formatDate(s.date), s]));

      let turtleNeckTotalSec = 0;
      let roundShoulderTotalSec = 0;
      let shoulderAsymmetryTotalSec = 0;
      let darkEnvTotalSec = 0;
      let weeklyGoodPostureSec = 0;
      let weeklyTotalDetectionSec = 0;
      let worstWeekday: Weekday | null = null;
      let worstScore = Number.POSITIVE_INFINITY;

      const dailyStats: WeeklyDailyStatDto[] = [];

      for (let i = 0; i < 7; i++) {
        const d = addDays(from, i);
        const key = formatDate(d);
        const s = byDate.get(key);
        const weekday = WEEKDAY_VALUES[d.getUTCDay()];

        const totalSec = s?.totalDetectionSec ?? 0;
        const goodSec = s?.goodPostureSec ?? 0;
        const hasData = s !== undefined;

        turtleNeckTotalSec += s?.turtleNeckSec ?? 0;
        roundShoulderTotalSec += s?.roundShoulderSec ?? 0;
        shoulderAsymmetryTotalSec += s?.shoulderAsymmetrySec ?? 0;
        darkEnvTotalSec += s?.darkEnvSec ?? 0;
        weeklyGoodPostureSec += goodSec;
        weeklyTotalDetectionSec += totalSec;

        const badPostureRatio = hasData
          ? totalSec > 0
            ? Math.round(((totalSec - goodSec) / totalSec) * 100) / 100
            : 0
          : null;

        dailyStats.push({ date: key, weekday, totalDetectionSec: totalSec, badPostureRatio, hasData });

        const score = s?.healthScore ?? null;
        if (score !== null && score < worstScore) {
          worstScore = score;
          worstWeekday = weekday;
        }
      }

      const badPostureSec = turtleNeckTotalSec + roundShoulderTotalSec + shoulderAsymmetryTotalSec;
      const sumAllSec = weeklyGoodPostureSec + badPostureSec + darkEnvTotalSec;
      const overlapSec = Math.max(0, sumAllSec - weeklyTotalDetectionSec);
      const unclassifiedSec = Math.max(0, weeklyTotalDetectionSec - sumAllSec);

      const goodPostureRatio = weeklyTotalDetectionSec > 0
        ? Math.round((weeklyGoodPostureSec / weeklyTotalDetectionSec) * 100) / 100
        : 0;
      const warningRatio = weeklyTotalDetectionSec > 0
        ? Math.round((badPostureSec / weeklyTotalDetectionSec) * 100) / 100
        : 0;
      const riskPercent = weeklyTotalDetectionSec > 0
        ? Math.round((badPostureSec / weeklyTotalDetectionSec) * 100)
        : 0;

      const breakdown: WeeklyBreakdownDto = {
        turtleNeckSec: turtleNeckTotalSec,
        turtleNeckRatio: badPostureSec > 0 ? Math.round((turtleNeckTotalSec / badPostureSec) * 100) / 100 : 0,
        roundShoulderSec: roundShoulderTotalSec,
        roundShoulderRatio: badPostureSec > 0 ? Math.round((roundShoulderTotalSec / badPostureSec) * 100) / 100 : 0,
        shoulderAsymmetrySec: shoulderAsymmetryTotalSec,
        shoulderAsymmetryRatio: badPostureSec > 0 ? Math.round((shoulderAsymmetryTotalSec / badPostureSec) * 100) / 100 : 0,
        overlapSec,
      };

      return {
        weekStartDate: fromStr,
        weekEndDate: formatDate(to),
        totalDetectionSec: weeklyTotalDetectionSec,
        goodPostureSec: weeklyGoodPostureSec,
        badPostureSec,
        darkEnvSec: darkEnvTotalSec,
        unclassifiedSec,
        riskPercent,
        goodPostureRatio,
        warningRatio,
        worstWeekday,
        breakdown,
        dailyStats,
      };
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 주간 대시보드를 조회할 수 없습니다.');
    }
  }

  async createTimelineEntry(
    userId: string,
    dto: CreateTimelineEntryDto,
  ): Promise<CreateTimelineEntryResponseDto> {
    try {
      const date = parseDate(dto.date);
      if (!date) {
        throw new BadRequestException('date는 YYYY-MM-DD 형식이어야 합니다.');
      }

      await this.prisma.timelineEntry.create({
        data: {
          userId,
          date,
          time: dto.time,
          dominantState: dto.dominantState,
          message: dto.message ?? '',
        },
      });

      return { accepted: 1 };
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 타임라인 항목을 저장할 수 없습니다.');
    }
  }

  async getTimeline(
    userId: string,
    dateStr: string,
  ): Promise<TimelineDashboardDto> {
    try {
      const date = parseDate(dateStr);
      if (!date) {
        throw new BadRequestException('date는 YYYY-MM-DD 형식이어야 합니다.');
      }

      const entries = await this.prisma.timelineEntry.findMany({
        where: { userId, date },
        orderBy: { time: 'asc' },
        select: { time: true, dominantState: true, message: true },
      });

      const buckets: TimelineBucketDto[] = entries.map((e) => ({
        time: e.time,
        dominantState: e.dominantState as TimelineBucketDto['dominantState'],
        message: e.message,
      }));

      return { date: dateStr, buckets };
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 타임라인을 조회할 수 없습니다.');
    }
  }

  async getCurrentSlotStats(userId: string): Promise<CurrentSlotDto> {
    try {
      const now = new Date();
      const slotIndex = Math.floor(seoulHour(now) / 3);
      const today = todaySeoulDate();
      const slotStartUtc = new Date(seoulDayStartUtc(today).getTime() + slotIndex * 3 * 3_600_000);
      const slotEndUtc = new Date(slotStartUtc.getTime() + 3 * 3_600_000);

      const grouped = await this.prisma.detectionEvent.groupBy({
        by: ['type'],
        where: { userId, detectedAt: { gte: slotStartUtc, lt: slotEndUtc } },
        _count: { type: true },
      });

      const countByType = new Map(grouped.map((g) => [g.type, g._count.type]));
      const counts = {
        goodPostureCount: countByType.get(DetectionType.GOOD_POSTURE) ?? 0,
        turtleNeckCount: countByType.get(DetectionType.TURTLE_NECK) ?? 0,
        roundShoulderCount: countByType.get(DetectionType.ROUND_SHOULDER) ?? 0,
        shoulderAsymmetryCount: countByType.get(DetectionType.SHOULDER_ASYMMETRY) ?? 0,
        darkEnvCount: countByType.get(DetectionType.DARK_ENV) ?? 0,
      };

      await this.prisma.dailySlotStat.upsert({
        where: { userId_date_slotIndex: { userId, date: today, slotIndex } },
        update: counts,
        create: { userId, date: today, slotIndex, ...counts },
      });

      return { slotIndex, startHour: slotIndex * 3, endHour: slotIndex * 3 + 3, ...counts };
    } catch (e) {
      rethrowAsInternal(e, '서버 오류: 현재 슬롯 자세 건수를 조회할 수 없습니다.');
    }
  }

  private calcPctChange(current: number | null, prev: number | null): number | null {
    if (current === null || prev === null || prev === 0) return null;
    return Math.round(((current - prev) / prev) * 1000) / 10;
  }
}
