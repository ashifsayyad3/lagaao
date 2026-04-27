import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('AI')
@Controller('ai')
export class AIController {
  constructor(private aiService: AIService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('chat')
  chat(
    @CurrentUser('id') userId: string,
    @Body('message') message: string,
    @Body('sessionId') sessionId: string,
  ) {
    return this.aiService.chat(userId, sessionId || 'default', message);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('recommendations')
  recommendations(@CurrentUser('id') userId: string, @Query('limit') limit?: number) {
    return this.aiService.getRecommendations(userId, limit);
  }

  @Public()
  @Get('search-suggestions')
  suggestions(@Query('q') q: string) {
    return this.aiService.getSearchSuggestions(q);
  }
}
