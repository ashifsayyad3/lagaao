import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import slugify from 'slugify';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    status?: string;
    featured?: boolean;
  }) {
    const { page = 1, limit = 20, category, search, minPrice, maxPrice, sort = 'createdAt_desc', status = 'ACTIVE', featured } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (featured !== undefined) where.isFeatured = featured;
    if (category) {
      const cat = await this.prisma.category.findUnique({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    const [sortField, sortDir] = sort.split('_');
    const orderBy: any = { [sortField === 'price' ? 'price' : sortField === 'rating' ? 'avgRating' : 'createdAt']: sortDir === 'asc' ? 'asc' : 'desc' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          inventory: { select: { quantity: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
        category: true,
        inventory: true,
        reviews: {
          where: { status: 'APPROVED' },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
        },
      },
    });
    if (!product || product.deletedAt) throw new NotFoundException('Product not found');

    await this.prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } });
    return product;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        category: true,
        inventory: true,
      },
    });
    if (!product || product.deletedAt) throw new NotFoundException('Product not found');
    return product;
  }

  async create(data: any) {
    const slug = data.slug || slugify(data.name, { lower: true, strict: true });
    const sku = data.sku || `SKU-${Date.now()}`;

    const { images, variants, ...productData } = data;

    return this.prisma.product.create({
      data: {
        ...productData,
        slug,
        sku,
        images: images ? { create: images } : undefined,
        variants: variants ? { create: variants } : undefined,
        inventory: { create: { quantity: data.stock || 0 } },
      },
      include: { images: true, variants: true, inventory: true },
    });
  }

  async update(id: string, data: any) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.deletedAt) throw new NotFoundException('Product not found');
    const { images, variants, stock, ...updateData } = data;
    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { images: true, variants: true, inventory: true },
    });
  }

  async delete(id: string) {
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date(), status: 'DISCONTINUED' } });
    return { message: 'Product deleted' };
  }

  async getFeatured(limit = 8) {
    return this.prisma.product.findMany({
      where: { isFeatured: true, status: 'ACTIVE', deletedAt: null },
      take: limit,
      include: { images: { where: { isPrimary: true }, take: 1 }, inventory: true },
    });
  }

  async getBestSellers(limit = 8) {
    return this.prisma.product.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      take: limit,
      orderBy: { totalSold: 'desc' },
      include: { images: { where: { isPrimary: true }, take: 1 }, inventory: true },
    });
  }

  async search(q: string, limit = 10) {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        OR: [
          { name: { contains: q } },
          { tags: { contains: q } },
        ],
      },
      take: limit,
      select: { id: true, name: true, slug: true, price: true, images: { take: 1 } },
    });
  }
}
