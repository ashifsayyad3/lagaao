import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private events: EventEmitter2,
  ) {
    this.razorpay = new Razorpay({
      key_id: config.get('RAZORPAY_KEY_ID'),
      key_secret: config.get('RAZORPAY_KEY_SECRET'),
    });
  }

  async createRazorpayOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');

    const rzOrder = await this.razorpay.orders.create({
      amount: Math.round(Number(order.total) * 100), // paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: order.id, userId },
    });

    await this.prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        method: 'RAZORPAY',
        status: 'PENDING',
        amount: order.total,
        razorpayOrderId: rzOrder.id,
      },
      update: { razorpayOrderId: rzOrder.id },
    });

    return {
      razorpayOrderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      key: this.config.get('RAZORPAY_KEY_ID'),
      orderNumber: order.orderNumber,
    };
  }

  async verifyPayment(dto: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId: string;
  }) {
    const body = dto.razorpayOrderId + '|' + dto.razorpayPaymentId;
    const expectedSig = crypto
      .createHmac('sha256', this.config.get('RAZORPAY_KEY_SECRET'))
      .update(body)
      .digest('hex');

    if (expectedSig !== dto.razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const payment = await this.prisma.payment.update({
      where: { orderId: dto.orderId },
      data: {
        razorpayPaymentId: dto.razorpayPaymentId,
        razorpaySignature: dto.razorpaySignature,
        status: 'CAPTURED',
        paidAt: new Date(),
      },
    });

    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: { status: 'CONFIRMED' },
    });

    this.events.emit('payment.success', { payment, orderId: dto.orderId });
    return { success: true, message: 'Payment verified successfully' };
  }

  async handleWebhook(payload: any, signature: string) {
    const expectedSig = crypto
      .createHmac('sha256', this.config.get('RAZORPAY_WEBHOOK_SECRET'))
      .update(JSON.stringify(payload))
      .digest('hex');

    if (expectedSig !== signature) {
      this.logger.warn('Invalid webhook signature');
      return;
    }

    const event = payload.event;
    const entity = payload.payload?.payment?.entity;

    if (event === 'payment.failed' && entity) {
      await this.prisma.payment.updateMany({
        where: { razorpayOrderId: entity.order_id },
        data: { status: 'FAILED', failureReason: entity.error_description },
      });
    }

    this.logger.log(`Webhook processed: ${event}`);
    return { received: true };
  }

  async initiateRefund(orderId: string, amount?: number) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment || payment.status !== 'CAPTURED') throw new BadRequestException('Payment not eligible for refund');

    const refundAmount = amount || Number(payment.amount);
    const refund = await this.razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100),
    });

    await this.prisma.payment.update({
      where: { orderId },
      data: {
        status: 'REFUNDED',
        refundId: refund.id,
        refundAmount,
        refundedAt: new Date(),
      },
    });

    return { success: true, refundId: refund.id };
  }

  async getPayment(orderId: string) {
    return this.prisma.payment.findUnique({ where: { orderId } });
  }
}
