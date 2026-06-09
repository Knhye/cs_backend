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
import { UploadSegmentsDto, UploadSegmentsResponseDto } from './dto/upload-segments.dto.js';
import { SessionService } from './session.service.js';

@ApiTags('Session')
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '감지 이벤트 배치 업로드 (최대 100건, 레거시)' })
  @ApiCommonResponse({ type: UploadEventsResponseDto })
  async uploadEvents(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UploadEventsDto,
  ): Promise<UploadEventsResponseDto> {
    return this.sessionService.uploadEvents(user.id, id, dto);
  }

  @Post(':id/segments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '감지 구간 배치 업로드 (최대 200건)',
    description:
      '구간 단위로 감지 상태를 저장합니다. durationSec는 서버가 startedAt/endedAt으로 계산합니다.\n\n' +
      'KST 날짜 경계에서 자동 분리되며, clientEventId로 중복을 차단합니다.',
  })
  @ApiCommonResponse({ type: UploadSegmentsResponseDto, status: 201 })
  async uploadSegments(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UploadSegmentsDto,
  ): Promise<UploadSegmentsResponseDto> {
    return this.sessionService.uploadSegments(user.id, id, dto);
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
