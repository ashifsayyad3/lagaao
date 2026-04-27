import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly phoneId: string;

  constructor(private config: ConfigService) {
    this.token = config.get('WHATSAPP_TOKEN', '');
    this.phoneId = config.get('WHATSAPP_PHONE_ID', '');
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneId}/messages`;
  }

  async sendOrderConfirmation(phone: string, orderNumber: string, total: string) {
    await this.sendTemplate(phone, 'order_confirmation', [orderNumber, total]);
  }

  async sendShipmentUpdate(phone: string, orderNumber: string, awb: string) {
    await this.sendTemplate(phone, 'shipment_update', [orderNumber, awb]);
  }

  async sendTextMessage(phone: string, message: string) {
    if (!this.token) return;
    try {
      await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to: `91${phone}`,
          type: 'text',
          text: { body: message },
        },
        { headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      this.logger.error('WhatsApp send failed:', err.message);
    }
  }

  private async sendTemplate(phone: string, templateName: string, params: string[]) {
    if (!this.token) return;
    try {
      await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to: `91${phone}`,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: params.map((p) => ({ type: 'text', text: p })),
              },
            ],
          },
        },
        { headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      this.logger.error(`WhatsApp template ${templateName} failed:`, err.message);
    }
  }
}
