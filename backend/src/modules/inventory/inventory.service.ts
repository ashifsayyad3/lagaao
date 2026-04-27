import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventory(productId: string) {
    const inv = await this.prisma.inventory.findUnique({ where: { productId } });
    if (!inv) throw new NotFoundException('Inventory not found');
    return inv;
  }

  async updateStock(productId: string, quantity: number) {
    return this.prisma.inventory.update({
      where: { productId },
      data: { quantity, lastRestockedAt: new Date() },
    });
  }

  async adjustStock(productId: string, delta: number) {
    const inv = await this.prisma.inventory.findUnique({ where: { productId } });
    if (!inv) throw new NotFoundException('Inventory not found');
    const newQty = inv.quantity + delta;
    if (newQty < 0) throw new BadRequestException('Insufficient stock');
    return this.prisma.inventory.update({ where: { productId }, data: { quantity: newQty } });
  }

  async reserveStock(productId: string, qty: number) {
    const inv = await this.prisma.inventory.findUnique({ where: { productId } });
    if (!inv) throw new NotFoundException('Inventory not found');
    const available = inv.quantity - inv.reservedQty;
    if (available < qty) throw new BadRequestException('Insufficient available stock');
    return this.prisma.inventory.update({
      where: { productId },
      data: { reservedQty: { increment: qty } },
    });
  }

  async releaseReservation(productId: string, qty: number) {
    return this.prisma.inventory.update({
      where: { productId },
      data: { reservedQty: { decrement: qty } },
    });
  }

  async deductStock(productId: string, qty: number) {
    const inv = await this.prisma.inventory.findUnique({ where: { productId } });
    if (!inv) throw new NotFoundException('Inventory not found');
    const newQty = inv.quantity - qty;
    if (newQty < 0) throw new BadRequestException('Insufficient stock');
    return this.prisma.inventory.update({
      where: { productId },
      data: {
        quantity: newQty,
        reservedQty: Math.max(0, inv.reservedQty - qty),
      },
    });
  }

  async getLowStockProducts() {
    const inventories = await this.prisma.inventory.findMany({
      where: { quantity: { lte: this.prisma.inventory.fields.reorderLevel } },
    });
    return inventories;
  }

  async getAllInventory(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        skip,
        take: limit,
        include: { product: { select: { id: true, name: true, sku: true, status: true } } },
      }),
      this.prisma.inventory.count(),
    ]);
    return { items, total, page, limit };
  }
}
