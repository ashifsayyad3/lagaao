import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(data: {
    userId?: string;
    sessionId?: string;
    event: string;
    properties?: any;
    page?: string;
    referrer?: string;
    userAgent?: string;
    ip?: string;
  }) {
    return this.prisma.analyticsEvent.create({ data });
  }

  async getDashboard() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalOrders,
      todayOrders,
      monthOrders,
      totalRevenue,
      monthRevenue,
      totalUsers,
      todayUsers,
      totalProducts,
      pendingOrders,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: thisMonth }, status: { not: 'CANCELLED' } } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
      this.prisma.product.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, email: true } } },
      }),
      this.prisma.product.findMany({
        take: 5,
        orderBy: { totalSold: 'desc' },
        select: { id: true, name: true, totalSold: true, price: true },
      }),
    ]);

    return {
      overview: {
        totalOrders, todayOrders, monthOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        monthRevenue: monthRevenue._sum.total || 0,
        totalUsers, todayUsers, totalProducts, pendingOrders,
      },
      recentOrders,
      topProducts,
    };
  }

  async getRevenueChart(period: 'week' | 'month' | 'year' = 'month') {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const chartData = orders.reduce((acc: any, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + Number(order.total);
      return acc;
    }, {});

    return Object.entries(chartData).map(([date, revenue]) => ({ date, revenue }));
  }
}
