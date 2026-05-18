import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ApiCommonResponse } from '../common/decorators/api-common-response.decorator.js';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator.js';
import { AuthService } from './auth.service.js';
import { EmailVerificationService } from './email-verification.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { SendEmailCodeDto } from './dto/send-email-code.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto.js';
import { TokenResponseDto } from './dto/token-response.dto.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { GoogleProfile } from './strategies/google.strategy.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('email/send-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증 코드 발송' })
  @ApiCommonResponse({})
  async sendEmailCode(@Body() dto: SendEmailCodeDto): Promise<void> {
    await this.emailVerificationService.sendCode(dto.email);
  }

  @Post('email/verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증 코드 확인' })
  @ApiCommonResponse({})
  async verifyEmailCode(@Body() dto: VerifyEmailCodeDto): Promise<void> {
    await this.emailVerificationService.verifyCode(dto.email, dto.code);
  }

  @Post('signup')
  @ApiOperation({ summary: '회원가입' })
  @ApiCommonResponse({ type: TokenResponseDto, status: 201 })
  async signup(@Body() dto: SignupDto): Promise<TokenResponseDto> {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  @ApiCommonResponse({ type: TokenResponseDto })
  async login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(dto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google 로그인 시작' })
  googleAuth(): void {
    // Guard가 Google OAuth로 리디렉트 처리
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google 로그인 콜백' })
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const profile = req.user as GoogleProfile;
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const redirectUrl = new URL('/auth/callback', frontendUrl);

    try {
      const tokens = await this.authService.googleLogin(profile);
      redirectUrl.searchParams.set('accessToken', tokens.accessToken);
      redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
    } catch (error) {
      redirectUrl.searchParams.set(
        'error',
        error instanceof Error ? error.message : 'google_login_failed',
      );
    }

    res.redirect(redirectUrl.toString());
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiCommonResponse({ type: TokenResponseDto })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '로그아웃' })
  @ApiCommonResponse({})
  async logout(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ): Promise<void> {
    await this.authService.logout(user.id, this.extractBearerToken(req));
  }

  @Delete('withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원탈퇴' })
  @ApiCommonResponse({})
  async withdraw(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ): Promise<void> {
    await this.authService.withdraw(user.id, this.extractBearerToken(req));
  }

  private extractBearerToken(req: Request): string {
    return req.headers.authorization?.replace('Bearer ', '') ?? '';
  }
}
