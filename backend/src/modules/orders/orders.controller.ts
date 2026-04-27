import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  createOrder(
    @CurrentUser('id') userId: string,
    @Body() body: { addressId: string; couponCode?: string; notes?: string },
  ) {
    return this.ordersService.createOrder(userId, body);
  }

  @Get()
  getOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.getOrders(userId, page, limit);
  }

  @Get(':id')
  getOrder(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ordersService.getOrderById(id, userId);
  }

  @Put(':id/cancel')
  cancelOrder(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.cancelOrder(id, userId, reason);
  }

  // Admin routes
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'manager')
  @Get('admin/all')
  getAllOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getAllOrders(page, limit, status);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'manager')
  @Put('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status);
  }
}
