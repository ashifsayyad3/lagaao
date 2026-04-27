import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService, private events: EventEmitter2) {}

  async createOrder(userId: string, dto: { addressId: string; couponCode?: string; notes?: string }) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { inventory: true } },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

    const address = await this.prisma.address.findFirst({ where: { id: dto.addressId, userId } });
    if (!address) throw new NotFoundException('Address not found');

    // Validate stock and calculate totals
    let subtotal = 0;
    const orderItems = [];
    for (const item of cart.items) {
      if (item.product.status !== 'ACTIVE') throw new BadRequestException(`${item.product.name} is not available`);
      if (item.product.inventory.quantity < item.quantity) throw new BadRequestException(`Insufficient stock for ${item.product.name}`);

      const unitPrice = Number(item.variant?.price || item.product.price);
      const taxAmount = unitPrice * item.quantity * (Number(item.product.taxPercent) / 100);
      const total = unitPrice * item.quantity + taxAmount;
      subtotal += unitPrice * item.quantity;

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        variantName: item.variant?.name,
        sku: item.variant?.sku || item.product.sku,
        quantity: item.quantity,
        unitPrice,
        taxPercent: item.product.taxPercent,
        taxAmount,
        total,
        imageUrl: null,
      });
    }

    // Apply coupon
    let discountAmount = 0;
    let couponId = null;
    if (dto.couponCode) {
      const coupon = await this.validateCoupon(dto.couponCode, userId, subtotal);
      discountAmount = this.calculateDiscount(coupon, subtotal);
      couponId = coupon.id;
    }

    const shippingAmount = subtotal >= 499 ? 0 : 49; // Free shipping above ₹499
    const taxAmount = orderItems.reduce((s, i) => s + Number(i.taxAmount), 0);
    const total = subtotal + taxAmount + shippingAmount - discountAmount;

    const orderNumber = `LGO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: dto.addressId,
          subtotal,
          taxAmount,
          shippingAmount,
          discountAmount,
          total,
          couponId,
          couponCode: dto.couponCode,
          notes: dto.notes,
          items: { create: orderItems },
        },
        include: { items: true, address: true },
      });

      // Deduct inventory
      for (const item of cart.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity }, reservedQty: { decrement: Math.min(item.quantity, 0) } },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { totalSold: { increment: item.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      // Record coupon usage
      if (couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { usageCount: { increment: 1 } } });
        await tx.couponUsage.create({ data: { couponId, userId, orderId: newOrder.id } });
      }

      return newOrder;
    });

    this.events.emit('order.created', order);
    return order;
  }

  async getOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
          payment: { select: { status: true, method: true } },
          shipment: { select: { status: true, awbNumber: true, trackingUrl: true } },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOrderById(id: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { images: { take: 1 } } } } },
        address: true,
        payment: true,
        shipment: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (userId && order.userId !== userId) throw new ForbiddenException();
    return order;
  }

  async getOrderByNumber(orderNumber: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, userId },
      include: {
        items: { include: { product: { include: { images: { take: 1 } } } } },
        address: true,
        payment: true,
        shipment: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async cancelOrder(id: string, userId: string, reason: string) {
    const order = await this.getOrderById(id, userId);
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED', cancelReason: reason, cancelledAt: new Date() },
    });

    // Restore inventory
    for (const item of order.items) {
      await this.prisma.inventory.update({
        where: { productId: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }

    this.events.emit('order.cancelled', updated);
    return updated;
  }

  async updateStatus(id: string, status: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: status as any, ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}) },
    });
    this.events.emit('order.statusUpdated', order);
    return order;
  }

  async getAllOrders(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          items: { select: { id: true, productName: true, quantity: true, total: true } },
          payment: { select: { status: true } },
          shipment: { select: { status: true, awbNumber: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async validateCoupon(code: string, userId: string, orderTotal: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) throw new BadRequestException('Invalid coupon');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Coupon expired');
    if (coupon.startsAt && coupon.startsAt > new Date()) throw new BadRequestException('Coupon not yet active');
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) throw new BadRequestException('Coupon usage limit reached');
    if (coupon.minOrderAmount && orderTotal < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(`Minimum order amount ₹${coupon.minOrderAmount} required`);
    }
    const userUsage = await this.prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (userUsage >= coupon.perUserLimit) throw new BadRequestException('Coupon already used');
    return coupon;
  }

  private calculateDiscount(coupon: any, subtotal: number): number {
    if (coupon.type === 'PERCENTAGE') {
      const discount = (subtotal * Number(coupon.value)) / 100;
      return coupon.maxDiscount ? Math.min(discount, Number(coupon.maxDiscount)) : discount;
    }
    if (coupon.type === 'FIXED') return Math.min(Number(coupon.value), subtotal);
    return 0;
  }
}
