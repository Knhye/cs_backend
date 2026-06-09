import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

const MONDAY = '2025-06-02';

function makeDay(
  dateStr: string,
  overrides: Partial<{
    totalDetectionSec: number;
    goodPostureSec: number;
    turtleNeckSec: number;
    roundShoulderSec: number;
    shoulderAsymmetrySec: number;
    darkEnvSec: number;
    unclassifiedSec: number;
    healthScore: number | null;
    postureScore: number | null;
  }> = {},
) {
  return {
    id: 'test-id',
    userId: 'user1',
    date: new Date(dateStr + 'T00:00:00.000Z'),
    totalDetectionSec: 0,
    goodPostureSec: 0,
    turtleNeckSec: 0,
    roundShoulderSec: 0,
    shoulderAsymmetrySec: 0,
    darkEnvSec: 0,
    unclassifiedSec: 0,
    goodPostureCount: 0,
    turtleNeckCount: 0,
    roundShoulderCount: 0,
    shoulderAsymmetryCount: 0,
    darkEnvCount: 0,
    healthScore: null,
    postureScore: null,
    warningCount: 0,
    ...overrides,
  };
}

describe('DashboardService.getWeekly', () => {
  let service: DashboardService;
  let findMany: jest.Mock;

  beforeEach(() => {
    findMany = jest.fn();
    const mockPrisma = {
      dailyStat: { findMany },
    } as unknown as PrismaService;
    service = new DashboardService(mockPrisma);
  });

  describe('합계 보장', () => {
    it('totalDetectionSec = good + turtle + round + asymmetry + dark + unclassified (per day)', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, {
          totalDetectionSec: 200,
          goodPostureSec: 80,
          turtleNeckSec: 40,
          roundShoulderSec: 20,
          shoulderAsymmetrySec: 10,
          darkEnvSec: 10,
          unclassifiedSec: 40,
        }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);
      const mon = result.dailyStats.find((d) => d.date === MONDAY)!;

      const reconstructed =
        mon.goodPostureSec +
        mon.turtleNeckSec +
        mon.roundShoulderSec +
        mon.shoulderAsymmetrySec +
        mon.darkEnvSec +
        mon.unclassifiedSec;
      expect(mon.totalDetectionSec).toBe(200);
      expect(reconstructed).toBe(200);
    });
  });

  describe('비율 계산', () => {
    it('goodPostureRatio = goodSec / totalSec (소수 4자리)', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, { totalDetectionSec: 200, goodPostureSec: 100 }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);
      const mon = result.dailyStats.find((d) => d.date === MONDAY)!;

      expect(mon.goodPostureRatio).toBe(0.5);
    });

    it('badPostureRatio = (turtle+round+asymmetry) / totalSec', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, {
          totalDetectionSec: 3600,
          goodPostureSec: 1800,
          turtleNeckSec: 600,
          roundShoulderSec: 600,
          shoulderAsymmetrySec: 300,
          darkEnvSec: 60,
          unclassifiedSec: 240,
        }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);
      const mon = result.dailyStats.find((d) => d.date === MONDAY)!;

      // badPostureSec = 600+600+300 = 1500, ratio = 1500/3600 ≈ 0.4167
      expect(mon.badPostureRatio).toBeCloseTo(0.4167, 3);
    });

    it('totalDetectionSec=0이면 goodPostureRatio=0, badPostureRatio=0', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, { totalDetectionSec: 0 }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);
      const mon = result.dailyStats.find((d) => d.date === MONDAY)!;

      expect(mon.goodPostureRatio).toBe(0);
      expect(mon.badPostureRatio).toBe(0);
    });
  });

  describe('hasData 필드', () => {
    it('데이터 있는 날: hasData=true', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, { totalDetectionSec: 100, goodPostureSec: 40 }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);
      const mon = result.dailyStats.find((d) => d.date === MONDAY)!;

      expect(mon.hasData).toBe(true);
    });

    it('데이터 없는 날: hasData=false, 모든 sec=0, ratio=0', async () => {
      findMany.mockResolvedValue([]);

      const result = await service.getWeekly('user1', MONDAY);

      result.dailyStats.forEach((d) => {
        expect(d.hasData).toBe(false);
        expect(d.totalDetectionSec).toBe(0);
        expect(d.goodPostureRatio).toBe(0);
        expect(d.badPostureRatio).toBe(0);
      });
    });
  });

  describe('날짜 범위 검증', () => {
    it('월요일이 아닌 from → BadRequestException', async () => {
      await expect(service.getWeekly('user1', '2025-06-03')).rejects.toThrow('월요일');
    });

    it('잘못된 날짜 형식 → BadRequestException', async () => {
      await expect(service.getWeekly('user1', '20250602')).rejects.toThrow('YYYY-MM-DD');
    });

    it('weekEndDate는 weekStartDate + 6일', async () => {
      findMany.mockResolvedValue([]);

      const result = await service.getWeekly('user1', MONDAY);

      expect(result.weekStartDate).toBe(MONDAY);
      expect(result.weekEndDate).toBe('2025-06-08');
    });

    it('dailyStats는 항상 7개 반환', async () => {
      findMany.mockResolvedValue([]);

      const result = await service.getWeekly('user1', MONDAY);

      expect(result.dailyStats).toHaveLength(7);
    });

    it('7일 각각 date 필드가 올바른 순서', async () => {
      findMany.mockResolvedValue([]);

      const result = await service.getWeekly('user1', MONDAY);
      const dates = result.dailyStats.map((d) => d.date);

      expect(dates[0]).toBe('2025-06-02');
      expect(dates[6]).toBe('2025-06-08');
    });
  });
});
