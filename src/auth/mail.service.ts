import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASS'),
      },
    });
    this.from = this.config.get<string>(
      'SMTP_FROM',
      this.config.getOrThrow<string>('SMTP_USER'),
    );
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const subject = '이메일 인증 코드';
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>이메일 인증</h2>
        <p>아래 인증 코드를 입력해 주세요. (5분 내 유효)</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 16px; background: #f4f4f4; text-align: center;">
          ${code}
        </div>
        <p style="color: #888; font-size: 12px;">본인이 요청하지 않았다면 이 메일을 무시해 주세요.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.error(`메일 발송 실패: ${to}`, err as Error);
      throw new InternalServerErrorException('서버 오류: 메일 발송을 처리할 수 없습니다.');
    }
  }
}
