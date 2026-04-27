import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);
  private readonly apiBase = 'https://apiv2.shiprocket.in/v1/external';
  private token: string;
  private tokenExpiry: Date;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private events: EventEmitter2,
  ) {}

  private async getToken(): Promise<string> {
    if (this.token && this.tokenExpiry > new Date()) return this.token;

    const res = await axios.post(`${this.apiBase}/auth/login`, {
      email: this.config.get('SHIPROCKET_EMAIL'),
      password: this.config.get('SHIPROCKET_PASSWORD'),
    });

    this.token = res.data.token;
    this.tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000); // 9 days
    return this.token;
  }

  private async apiCall(method: string, endpoint: string, data?: any) {
    const token = await this.getToken();
    const res = await axios({
      method,
      url: `${this.apiBase}${endpoint}`,
      data,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    return res.data;
  }

  async createShipment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, address: true, user: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const payload = {
      order_id: order.orderNumber,
      order_date: order.createdAt.toISOString().split('T')[0],
      pickup_location: 'Primary',
      channel_id: '',
      billing_customer_name: order.address.fullName,
      billing_last_name: '',
      billing_address: order.address.line1,
      billing_address_2: order.address.line2 || '',
      billing_city: order.address.city,
      billing_pincode: order.address.pincode,
      billing_state: order.address.state,
      billing_country: order.address.country,
      billing_email: order.user.email,
      billing_phone: order.address.phone,
      shipping_is_billing: true,
      order_items: order.items.map((item) => ({
        name: item.productName,
        sku: item.sku,
        units: item.quantity,
        selling_price: item.unitPrice,
      })),
      payment_method: 'Prepaid',
      sub_total: order.subtotal,
      length: 20,
      breadth: 20,
      height: 20,
      weight: 0.5,
    };

    const result = await this.apiCall('POST', '/orders/create/adhoc', payload);

    const shipment = await this.prisma.shipment.upsert({
      where: { orderId },
      create: {
        orderId,
        shiprocketId: String(result.shipment_id),
        awbNumber: result.awb_code,
        courier: result.courier_name,
        status: 'PICKUP_SCHEDULED',
        trackingUrl: result.tracking_url || null,
        labelUrl: result.label_url || null,
      },
      update: {
        shiprocketId: String(result.shipment_id),
        awbNumber: result.awb_code,
        status: 'PICKUP_SCHEDULED',
      },
    });

    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'PROCESSING' } });
    this.events.emit('shipment.created', shipment);
    return shipment;
  }

  async trackShipment(orderId: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment || !shipment.awbNumber) throw new NotFoundException('Shipment not found');

    const result = await this.apiCall('GET', `/courier/track/awb/${shipment.awbNumber}`);

    const events = result.tracking_data?.shipment_track_activities || [];
    const latestStatus = events[0]?.activity || shipment.status;

    const statusMap: Record<string, any> = {
      'Delivered': 'DELIVERED',
      'Out For Delivery': 'OUT_FOR_DELIVERY',
      'In Transit': 'IN_TRANSIT',
      'Picked Up': 'PICKED_UP',
    };

    const newStatus = Object.keys(statusMap).find((k) => latestStatus.includes(k))
      ? statusMap[Object.keys(statusMap).find((k) => latestStatus.includes(k))]
      : shipment.status;

    await this.prisma.shipment.update({
      where: { orderId },
      data: { status: newStatus, shipmentEvents: events },
    });

    return { shipment, tracking: result.tracking_data };
  }

  async getShipment(orderId: string) {
    return this.prisma.shipment.findUnique({ where: { orderId } });
  }
}
