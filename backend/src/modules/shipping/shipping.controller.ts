import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Shipping')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shipping')
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Get(':orderId')
  getShipment(@Param('orderId') orderId: string) {
    return this.shippingService.getShipment(orderId);
  }

  @Get(':orderId/track')
  trackShipment(@Param('orderId') orderId: string) {
    return this.shippingService.trackShipment(orderId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'manager')
  @Post(':orderId/create')
  createShipment(@Param('orderId') orderId: string) {
    return this.shippingService.createShipment(orderId);
  }
}
