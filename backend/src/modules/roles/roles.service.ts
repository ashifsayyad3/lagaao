import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({ include: { rolePermissions: { include: { permission: true } } } });
  }

  async create(data: { name: string; description?: string }) {
    return this.prisma.role.create({ data });
  }

  async assignRole(userId: string, roleId: string) {
    return this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {},
    });
  }

  async removeRole(userId: string, roleId: string) {
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
    return { message: 'Role removed' };
  }

  async seed() {
    const roles = ['super_admin', 'admin', 'manager', 'support', 'customer'];
    for (const name of roles) {
      await this.prisma.role.upsert({ where: { name }, create: { name }, update: {} });
    }
    return { message: 'Roles seeded' };
  }
}
