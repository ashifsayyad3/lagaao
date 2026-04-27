import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'manager')
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  getAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.inventoryService.getAllInventory(page, limit);
  }

  @Get('low-stock')
  getLowStock() {
    return this.inventoryService.getLowStockProducts();
  }

  @Get(':productId')
  getInventory(@Param('productId') productId: string) {
    return this.inventoryService.getInventory(productId);
  }

  @Put(':productId/stock')
  updateStock(@Param('productId') productId: string, @Body('quantity') quantity: number) {
    return this.inventoryService.updateStock(productId, quantity);
  }

  @Put(':productId/adjust')
  adjustStock(@Param('productId') productId: string, @Body('delta') delta: number) {
    return this.inventoryService.adjustStock(productId, delta);
  }
}
