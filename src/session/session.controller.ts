import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiCommonResponse } from '../common/decorators/api-common-response.decorator.js';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator.js';
import { EndSessionDto } from './dto/end-session.dto.js';
import {
  CurrentSessionResponseDto,
  SessionEndResponseDto,
  SessionStartResponseDto,
  UploadEventsResponseDto,
} from './dto/session-response.dto.js';
import { StartSessionDto } from './dto/start-session.dto.js';
import { UploadEventsDto } from './dto/upload-events.dto.js';
import { SessionService } from './session.service.js';

@ApiTags('Session')
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '감지 세션 시작' })
  @ApiCommonResponse({ type: SessionStartResponseDto, status: 201 })
  async start(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: StartSessionDto,
  ): Promise<SessionStartResponseDto> {
    return this.sessionService.start(user.id, dto);
  }

  @Post(':id/end')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '감지 세션 종료 + 집계 확정 + 배지 부여' })
  @ApiCommonResponse({ type: SessionEndResponseDto })
  async end(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: EndSessionDto,
  ): Promise<SessionEndResponseDto> {
    return this.sessionService.end(user.id, id, dto);
  }

  @Post(':id/events')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '감지 이벤트 배치 업로드 (최대 100건)' })
  @ApiCommonResponse({ type: UploadEventsResponseDto })
  async uploadEvents(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UploadEventsDto,
  ): Promise<UploadEventsResponseDto> {
    return this.sessionService.uploadEvents(user.id, id, dto);
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '현재 진행 중인 세션 조회' })
  @ApiCommonResponse({ type: CurrentSessionResponseDto })
  async getCurrent(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CurrentSessionResponseDto | null> {
    return this.sessionService.getCurrent(user.id);
  }
}
