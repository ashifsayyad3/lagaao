import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, productId: string, data: { rating: number; title?: string; body?: string; images?: string[] }) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    // Check if user purchased the product
    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: { in: ['DELIVERED'] } },
      },
    });

    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) throw new BadRequestException('You have already reviewed this product');

    const review = await this.prisma.review.create({
      data: {
        productId,
        userId,
        rating: data.rating,
        title: data.title,
        body: data.body,
        images: data.images ? JSON.stringify(data.images) : null,
        isVerified: !!purchased,
        status: 'PENDING',
      },
      include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
    });

    await this.updateProductRating(productId);
    return review;
  }

  async findByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, status: 'APPROVED', deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
      }),
      this.prisma.review.count({ where: { productId, status: 'APPROVED' } }),
    ]);

    const ratingBreakdown = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { productId, status: 'APPROVED' },
      _count: { rating: true },
    });

    return { reviews, total, page, limit, ratingBreakdown };
  }

  async approve(id: string) {
    const review = await this.prisma.review.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
    await this.updateProductRating(review.productId);
    return review;
  }

  async reject(id: string) {
    const review = await this.prisma.review.update({ where: { id }, data: { status: 'REJECTED' } });
    await this.updateProductRating(review.productId);
    return review;
  }

  async delete(id: string, userId: string) {
    const review = await this.prisma.review.findFirst({ where: { id, userId } });
    if (!review) throw new NotFoundException('Review not found');
    await this.prisma.review.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.updateProductRating(review.productId);
    return { message: 'Review deleted' };
  }

  async findAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, email: true } },
          product: { select: { name: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return { reviews, total, page, limit };
  }

  private async updateProductRating(productId: string) {
    const result = await this.prisma.review.aggregate({
      where: { productId, status: 'APPROVED', deletedAt: null },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: result._avg.rating || 0,
        totalReviews: result._count.rating,
      },
    });
  }
}
