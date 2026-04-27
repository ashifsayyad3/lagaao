import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  getWishlist(@CurrentUser('id') userId: string) {
    return this.wishlistService.getWishlist(userId);
  }

  @Post('items')
  addItem(@CurrentUser('id') userId: string, @Body('productId') productId: string) {
    return this.wishlistService.addItem(userId, productId);
  }

  @Delete('items/:productId')
  removeItem(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.removeItem(userId, productId);
  }

  @Get('check/:productId')
  check(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.isInWishlist(userId, productId);
  }
}
