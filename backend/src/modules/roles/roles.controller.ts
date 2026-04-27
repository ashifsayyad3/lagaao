import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  findAll() { return this.rolesService.findAll(); }

  @Post()
  create(@Body() body: { name: string; description?: string }) { return this.rolesService.create(body); }

  @Post('assign')
  assign(@Body('userId') userId: string, @Body('roleId') roleId: string) {
    return this.rolesService.assignRole(userId, roleId);
  }

  @Delete('remove')
  remove(@Body('userId') userId: string, @Body('roleId') roleId: string) {
    return this.rolesService.removeRole(userId, roleId);
  }
}
