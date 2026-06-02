import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service.js';

export interface FcmPayload {
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

const STALE_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private messaging: admin.messaging.Messaging | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const raw = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT');
    if (!raw) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT 미설정 — FCM 비활성화');
      return;
    }

    let serviceAccount: admin.ServiceAccount;
    try {
      serviceAccount = JSON.parse(raw) as admin.ServiceAccount;
    } catch {
      this.logger.error('FIREBASE_SERVICE_ACCOUNT JSON 파싱 실패');
      return;
    }

    const app =
      admin.apps.length > 0
        ? admin.app()
        : admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });

    this.messaging = admin.messaging(app);
  }

  async sendToUser(userId: string, payload: FcmPayload): Promise<void> {
    if (!this.messaging) return;

    const [settings, tokens] = await Promise.all([
      this.prisma.userSettings.findUnique({
        where: { userId },
        select: { pushEnabled: true },
      }),
      this.prisma.pushToken.findMany({
        where: { userId },
        select: { token: true, deviceId: true },
      }),
    ]);

    if (!settings?.pushEnabled || tokens.length === 0) return;

    const { type, title, body, data } = payload;
    const staleDeviceIds: string[] = [];

    await Promise.all(
      tokens.map(async ({ token, deviceId }) => {
        try {
          await this.messaging!.send({
            token,
            notification: { title, body },
            data: { type, ...(data ?? {}) },
          });
        } catch (err: any) {
          const code: string = err?.code ?? err?.errorInfo?.code ?? '';
          if (STALE_CODES.has(code)) {
            staleDeviceIds.push(deviceId);
          } else {
            this.logger.error(
              `FCM 발송 실패 (deviceId=${deviceId}): ${err?.message}`,
            );
          }
        }
      }),
    );

    if (staleDeviceIds.length > 0) {
      await this.prisma.pushToken.deleteMany({
        where: { userId, deviceId: { in: staleDeviceIds } },
      });
    }
  }
}
