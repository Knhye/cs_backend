"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const badges = [
    {
        code: 'POSTURE_30M',
        name: '30분 집중',
        description: '누적 바른 자세 시간 30분 달성',
        category: client_1.BadgeCategory.POSTURE_TIME,
        requirementValue: 1800,
        iconUrl: null,
    },
    {
        code: 'POSTURE_1H',
        name: '한 시간 바른 자세',
        description: '누적 바른 자세 시간 1시간 달성',
        category: client_1.BadgeCategory.POSTURE_TIME,
        requirementValue: 3600,
        iconUrl: null,
    },
    {
        code: 'POSTURE_5H',
        name: '다섯 시간 마스터',
        description: '누적 바른 자세 시간 5시간 달성',
        category: client_1.BadgeCategory.POSTURE_TIME,
        requirementValue: 18000,
        iconUrl: null,
    },
    {
        code: 'POSTURE_10H',
        name: '열 시간 달인',
        description: '누적 바른 자세 시간 10시간 달성',
        category: client_1.BadgeCategory.POSTURE_TIME,
        requirementValue: 36000,
        iconUrl: null,
    },
    {
        code: 'STREAK_3D',
        name: '3일 연속 달성',
        description: '3일 연속 감지 세션 완료',
        category: client_1.BadgeCategory.STREAK,
        requirementValue: 3,
        iconUrl: null,
    },
    {
        code: 'STREAK_7D',
        name: '7일 연속 도전',
        description: '7일 연속 감지 세션 완료',
        category: client_1.BadgeCategory.STREAK,
        requirementValue: 7,
        iconUrl: null,
    },
    {
        code: 'STREAK_30D',
        name: '한 달 챌린저',
        description: '30일 연속 감지 세션 완료',
        category: client_1.BadgeCategory.STREAK,
        requirementValue: 30,
        iconUrl: null,
    },
    {
        code: 'FIRST_SESSION',
        name: '첫 걸음',
        description: '첫 번째 감지 세션 완료',
        category: client_1.BadgeCategory.SPECIAL,
        requirementValue: 1,
        iconUrl: null,
    },
];
async function main() {
    for (const badge of badges) {
        await prisma.badge.upsert({
            where: { code: badge.code },
            update: {
                name: badge.name,
                description: badge.description,
                requirementValue: badge.requirementValue,
            },
            create: badge,
        });
    }
    console.log(`Seeded ${badges.length} badges.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map