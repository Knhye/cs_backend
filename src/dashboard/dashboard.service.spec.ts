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

  describe('집계 검증 필드', () => {
    it('total = good + warning + dark + unclassified 합계 오차 1초 이내', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, {
          totalDetectionSec: 200,
          goodPostureSec: 80,
          turtleNeckSec: 40,
          roundShoulderSec: 20,
          shoulderAsymmetrySec: 10,
          darkEnvSec: 10,
        }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);

      const { totalDetectionSec, goodPostureSec, badPostureSec, darkEnvSec, unclassifiedSec } = result;
      const reconstructed = goodPostureSec + badPostureSec + darkEnvSec + unclassifiedSec;
      expect(Math.abs(totalDetectionSec - reconstructed)).toBeLessThanOrEqual(1);
      expect(totalDetectionSec).toBe(200);
      expect(goodPostureSec).toBe(80);
      expect(badPostureSec).toBe(70); // 40+20+10
      expect(darkEnvSec).toBe(10);
      expect(unclassifiedSec).toBe(40); // 200 - 80 - 70 - 10
    });

    it('7일 합산도 합계 등식 만족', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, { totalDetectionSec: 100, goodPostureSec: 40, turtleNeckSec: 30, darkEnvSec: 10 }),
        makeDay('2025-06-03', { totalDetectionSec: 80, goodPostureSec: 60, roundShoulderSec: 10 }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);

      const { totalDetectionSec, goodPostureSec, badPostureSec, darkEnvSec, unclassifiedSec } = result;
      const reconstructed = goodPostureSec + badPostureSec + darkEnvSec + unclassifiedSec;
      expect(Math.abs(totalDetectionSec - reconstructed)).toBeLessThanOrEqual(1);
    });
  });

  describe('동시 감지 오버랩', () => {
    it('자세 유형 합이 total 초과 시 overlapSec 반환, unclassifiedSec=0', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, {
          totalDetectionSec: 100,
          goodPostureSec: 0,
          turtleNeckSec: 60,
          roundShoulderSec: 60,
          shoulderAsymmetrySec: 0,
          darkEnvSec: 0,
        }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);

      // warning=120 > total=100 → overlap=20
      expect(result.breakdown.overlapSec).toBe(20);
      expect(result.unclassifiedSec).toBe(0);
    });

    it('중복 없을 때 overlapSec=0, unclassifiedSec >= 0', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, {
          totalDetectionSec: 300,
          goodPostureSec: 100,
          turtleNeckSec: 50,
          roundShoulderSec: 30,
          shoulderAsymmetrySec: 20,
          darkEnvSec: 50,
        }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);

      expect(result.breakdown.overlapSec).toBe(0);
      expect(result.unclassifiedSec).toBe(50); // 300 - 100 - 100 - 50
    });
  });

  describe('비율 계산', () => {
    it('goodPostureRatio = goodSec / totalSec (0.0~1.0)', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, { totalDetectionSec: 200, goodPostureSec: 80 }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);

      expect(result.goodPostureRatio).toBe(0.4);
    });

    it('warningRatio = badPostureSec / totalSec (0.0~1.0)', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, {
          totalDetectionSec: 200,
          goodPostureSec: 80,
          turtleNeckSec: 40,
          roundShoulderSec: 20,
          shoulderAsymmetrySec: 10,
        }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);

      // badPostureSec=70, total=200 → 0.35
      expect(result.warningRatio).toBe(0.35);
    });

    it('riskPercent는 warningRatio의 정수 퍼센트', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, {
          totalDetectionSec: 200,
          turtleNeckSec: 40,
          roundShoulderSec: 20,
          shoulderAsymmetrySec: 10,
        }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);

      expect(result.riskPercent).toBe(Math.round(result.warningRatio * 100));
    });
  });

  describe('요일별 경고 비율', () => {
    it('데이터 있는 날: badPostureRatio = (total - good) / total', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, { totalDetectionSec: 100, goodPostureSec: 40 }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);
      const mon = result.dailyStats.find((d) => d.date === MONDAY)!;

      expect(mon.badPostureRatio).toBe(0.6);
      expect(mon.hasData).toBe(true);
    });

    it('데이터 없는 날: badPostureRatio=null, hasData=false', async () => {
      findMany.mockResolvedValue([]); // 이번 주 데이터 없음

      const result = await service.getWeekly('user1', MONDAY);

      result.dailyStats.forEach((d) => {
        expect(d.badPostureRatio).toBeNull();
        expect(d.hasData).toBe(false);
      });
    });

    it('totalDetectionSec=0인 날(데이터 있음): badPostureRatio=0', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, { totalDetectionSec: 0, goodPostureSec: 0 }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);
      const mon = result.dailyStats.find((d) => d.date === MONDAY)!;

      expect(mon.badPostureRatio).toBe(0);
      expect(mon.hasData).toBe(true);
    });
  });

  describe('totalDetectionSec=0 엣지케이스', () => {
    it('데이터 없을 때 모든 비율 0, 집계 필드도 0', async () => {
      findMany.mockResolvedValue([]);

      const result = await service.getWeekly('user1', MONDAY);

      expect(result.totalDetectionSec).toBe(0);
      expect(result.goodPostureRatio).toBe(0);
      expect(result.warningRatio).toBe(0);
      expect(result.riskPercent).toBe(0);
      expect(result.unclassifiedSec).toBe(0);
      expect(result.breakdown.overlapSec).toBe(0);
    });
  });

  describe('경고 유형별 비중', () => {
    it('breakdown 비율 합 = 1 (오차 0.01 이내)', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, {
          turtleNeckSec: 40,
          roundShoulderSec: 20,
          shoulderAsymmetrySec: 10,
        }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);
      const { turtleNeckRatio, roundShoulderRatio, shoulderAsymmetryRatio } = result.breakdown;

      expect(Math.abs(turtleNeckRatio + roundShoulderRatio + shoulderAsymmetryRatio - 1)).toBeLessThan(0.01);
    });

    it('badPostureSec=0이면 breakdown 비율 모두 0', async () => {
      findMany.mockResolvedValue([
        makeDay(MONDAY, { totalDetectionSec: 100, goodPostureSec: 100 }),
      ]);

      const result = await service.getWeekly('user1', MONDAY);

      expect(result.breakdown.turtleNeckRatio).toBe(0);
      expect(result.breakdown.roundShoulderRatio).toBe(0);
      expect(result.breakdown.shoulderAsymmetryRatio).toBe(0);
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
  });
});
