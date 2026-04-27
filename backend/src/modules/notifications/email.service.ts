import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private fromEmail: string;

  constructor(private config: ConfigService) {
    this.fromEmail = config.get('SMTP_FROM', 'noreply@lagaao.com');
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST', 'smtp.gmail.com'),
      port: config.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    });
  }

  async sendOrderConfirmation(to: string, order: any) {
    await this.send({
      to,
      subject: `Order Confirmed! #${order.orderNumber} - LAGAAO`,
      html: this.orderConfirmationTemplate(order),
    });
  }

  async sendShipmentNotification(to: string, order: any, shipment: any) {
    await this.send({
      to,
      subject: `Your order #${order.orderNumber} is shipped!`,
      html: this.shipmentTemplate(order, shipment),
    });
  }

  async sendPasswordReset(to: string, token: string) {
    const resetUrl = `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: 'Reset your LAGAAO password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `${this.config.get('FRONTEND_URL')}/verify-email?token=${token}`;
    await this.send({
      to,
      subject: 'Verify your LAGAAO email',
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email address.</p>`,
    });
  }

  async send(options: { to: string; subject: string; html: string; text?: string }) {
    try {
      await this.transporter.sendMail({
        from: `"LAGAAO 🌱" <${this.fromEmail}>`,
        ...options,
      });
    } catch (err) {
      this.logger.error(`Email send failed to ${options.to}:`, err.message);
    }
  }

  private orderConfirmationTemplate(order: any): string {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#2d6a4f;padding:20px;text-align:center">
          <h1 style="color:white;margin:0">🌱 LAGAAO</h1>
        </div>
        <div style="padding:30px">
          <h2>Order Confirmed! 🎉</h2>
          <p>Hi ${order.user?.firstName || 'Customer'},</p>
          <p>Your order <strong>#${order.orderNumber}</strong> has been confirmed.</p>
          <p><strong>Total: ₹${order.total}</strong></p>
          <p>We'll notify you when your plants are on their way!</p>
          <a href="${this.config.get('FRONTEND_URL')}/orders/${order.id}"
             style="background:#2d6a4f;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:16px">
            Track Order
          </a>
        </div>
      </div>
    `;
  }

  private shipmentTemplate(order: any, shipment: any): string {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#2d6a4f;padding:20px;text-align:center">
          <h1 style="color:white;margin:0">🌱 LAGAAO</h1>
        </div>
        <div style="padding:30px">
          <h2>Your Order is Shipped! 🚚</h2>
          <p>Order <strong>#${order.orderNumber}</strong> is on its way.</p>
          <p><strong>AWB:</strong> ${shipment.awbNumber}</p>
          <p><strong>Courier:</strong> ${shipment.courier}</p>
          ${shipment.trackingUrl ? `<a href="${shipment.trackingUrl}">Track Package</a>` : ''}
        </div>
      </div>
    `;
  }
}
