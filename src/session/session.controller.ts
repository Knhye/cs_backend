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
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiCommonResponse } from '../common/decorators/api-common-response.decorator.js';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator.js';
import { EndSessionDto } from './dto/end-session.dto.js';
import { PauseSessionDto, PauseSessionResponseDto } from './dto/pause-session.dto.js';
import { ResumeSessionDto, ResumeSessionResponseDto } from './dto/resume-session.dto.js';
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
  @ApiConflictResponse({ description: '이미 진행 중인 세션 존재 (409)' })
  async start(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: StartSessionDto,
  ): Promise<SessionStartResponseDto> {
    return this.sessionService.start(user.id, dto);
  }

  @Post(':id/pause')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '세션 일시정지',
    description:
      'ACTIVE → PAUSED 상태 전이.\n\n' +
      '일시정지 중 업로드된 구간/이벤트는 거부됩니다.\n\n' +
      '이미 PAUSED 상태면 409를 반환합니다.',
  })
  @ApiCommonResponse({ type: PauseSessionResponseDto })
  @ApiConflictResponse({ description: '이미 일시정지됨 / 종료된 세션 (409)' })
  @ApiUnprocessableEntityResponse({ description: 'pausedAt이 미래이거나 세션 시작 이전 (422)' })
  async pause(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PauseSessionDto,
  ): Promise<PauseSessionResponseDto> {
    return this.sessionService.pause(user.id, id, dto);
  }

  @Post(':id/resume')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '세션 재개',
    description:
      'PAUSED → ACTIVE 상태 전이.\n\n' +
      'resumedAt - pausedAt 시간이 totalPausedSec에 누적됩니다.\n\n' +
      'ACTIVE 상태 세션에 호출하면 409를 반환합니다.',
  })
  @ApiCommonResponse({ type: ResumeSessionResponseDto })
  @ApiConflictResponse({ description: '일시정지 상태가 아님 / 종료된 세션 (409)' })
  @ApiUnprocessableEntityResponse({ description: 'resumedAt이 미래이거나 pausedAt 이전 (422)' })
  async resume(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResumeSessionDto,
  ): Promise<ResumeSessionResponseDto> {
    return this.sessionService.resume(user.id, id, dto);
  }

  @Post(':id/end')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '감지 세션 종료 + 집계 확정 + 배지 부여',
    description:
      'ACTIVE·PAUSED 모두 종료 가능.\n\n' +
      'PAUSED 상태로 종료 시 진행 중인 일시정지 구간을 자동 확정합니다.\n\n' +
      'totalDetectionSec = endedAt − startedAt − totalPausedSec',
  })
  @ApiCommonResponse({ type: SessionEndResponseDto })
  @ApiConflictResponse({ description: '이미 종료된 세션 (409)' })
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
  @ApiConflictResponse({ description: '종료 또는 일시정지된 세션 (409)' })
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
      'KST 날짜 경계에서 자동 분리되며, clientEventId로 중복을 차단합니다.\n\n' +
      '일시정지 상태에서는 업로드가 거부됩니다 (409).',
  })
  @ApiCommonResponse({ type: UploadSegmentsResponseDto, status: 201 })
  @ApiConflictResponse({ description: '종료·일시정지된 세션 또는 구간 중복 (409)' })
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
  @ApiOperation({
    summary: '현재 진행 중인 세션 조회',
    description: 'status(ACTIVE|PAUSED), pausedAt, totalPausedSec 포함.',
  })
  @ApiCommonResponse({ type: CurrentSessionResponseDto })
  async getCurrent(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CurrentSessionResponseDto | null> {
    return this.sessionService.getCurrent(user.id);
  }
}
