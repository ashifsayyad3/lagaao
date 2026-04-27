import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsListener {
  constructor(
    private notifications: NotificationsService,
    private email: EmailService,
    private whatsapp: WhatsAppService,
    private prisma: PrismaService,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreated(order: any) {
    const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
    if (!user) return;

    await this.email.sendOrderConfirmation(user.email, { ...order, user });
    if (user.phone) {
      await this.whatsapp.sendOrderConfirmation(user.phone, order.orderNumber, order.total.toString());
    }
    await this.notifications.create({
      userId: user.id,
      type: 'ORDER_PLACED',
      channel: 'IN_APP',
      subject: 'Order Placed',
      body: `Your order #${order.orderNumber} has been placed successfully.`,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    });
  }

  @OnEvent('payment.success')
  async handlePaymentSuccess({ payment, orderId }: any) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
    if (!order) return;
    await this.notifications.create({
      userId: order.userId,
      type: 'PAYMENT_SUCCESS',
      channel: 'IN_APP',
      subject: 'Payment Successful',
      body: `Payment of ₹${order.total} for order #${order.orderNumber} was successful.`,
      data: { orderId, orderNumber: order.orderNumber },
    });
  }

  @OnEvent('shipment.created')
  async handleShipmentCreated(shipment: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: shipment.orderId },
      include: { user: true },
    });
    if (!order) return;

    await this.email.sendShipmentNotification(order.user.email, order, shipment);
    if (order.user.phone) {
      await this.whatsapp.sendShipmentUpdate(order.user.phone, order.orderNumber, shipment.awbNumber);
    }
    await this.notifications.create({
      userId: order.userId,
      type: 'ORDER_SHIPPED',
      channel: 'IN_APP',
      subject: 'Order Shipped',
      body: `Your order #${order.orderNumber} has been shipped. AWB: ${shipment.awbNumber}`,
      data: { orderId: order.id, awbNumber: shipment.awbNumber },
    });
  }
}
