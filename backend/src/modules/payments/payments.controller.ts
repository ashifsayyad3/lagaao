import { Controller, Post, Body, Get, Param, Headers, UseGuards, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-order/:orderId')
  createOrder(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.createRazorpayOrder(orderId, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verifyPayment(@Body() body: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId: string;
  }) {
    return this.paymentsService.verifyPayment(body);
  }

  @Public()
  @Post('webhook')
  webhook(@Body() payload: any, @Headers('x-razorpay-signature') signature: string) {
    return this.paymentsService.handleWebhook(payload, signature);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':orderId')
  getPayment(@Param('orderId') orderId: string) {
    return this.paymentsService.getPayment(orderId);
  }
}
