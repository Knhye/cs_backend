import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiCommonResponse } from '../common/decorators/api-common-response.decorator.js';
import { BadgeService } from './badge.service.js';
import { BadgeDto } from './dto/badge-response.dto.js';

@ApiTags('Badge')
@Controller('badges')
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '전체 배지 목록 조회 (FR-05-01)',
    description: '시스템에 정의된 모든 배지 마스터 데이터를 반환합니다.',
  })
  @ApiCommonResponse({ type: BadgeDto, isArray: true })
  async getAllBadges(): Promise<BadgeDto[]> {
    return this.badgeService.getAllBadges();
  }
}
