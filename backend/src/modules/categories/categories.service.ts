import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true, deletedAt: null };
    return this.prisma.category.findMany({
      where,
      include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findRoots() {
    return this.prisma.category.findMany({
      where: { parentId: null, isActive: true, deletedAt: null },
      include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const cat = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: { where: { isActive: true } },
        parent: true,
      },
    });
    if (!cat || cat.deletedAt) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(data: any) {
    const slug = data.slug || slugify(data.name, { lower: true, strict: true });
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Category slug already exists');
    return this.prisma.category.create({ data: { ...data, slug } });
  }

  async update(id: string, data: any) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat || cat.deletedAt) throw new NotFoundException('Category not found');
    if (data.name && !data.slug) data.slug = slugify(data.name, { lower: true, strict: true });
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.prisma.category.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { message: 'Category deleted' };
  }
}
