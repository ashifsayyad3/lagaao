'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag, Users, Package, TrendingUp, Clock, AlertTriangle,
  ArrowUp, DollarSign, BarChart2
} from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => (api.get('/analytics/dashboard') as Promise<any>).then((d: any) => d.data),
    refetchInterval: 30000,
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-chart', 'month'],
    queryFn: () => (api.get('/analytics/revenue?period=month') as Promise<any>).then((d: any) => d.data),
  });

  const stats = data?.overview;

  const STAT_CARDS = [
    { label: 'Total Revenue', value: `₹${Number(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, subLabel: `This month: ₹${Number(stats?.monthRevenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'bg-green-500', trend: '+12%' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, subLabel: `Today: ${stats?.todayOrders || 0}`, icon: ShoppingBag, color: 'bg-blue-500', trend: '+8%' },
    { label: 'Total Users', value: stats?.totalUsers || 0, subLabel: `Today: ${stats?.todayUsers || 0}`, icon: Users, color: 'bg-purple-500', trend: '+5%' },
    { label: 'Active Products', value: stats?.totalProducts || 0, subLabel: `Pending orders: ${stats?.pendingOrders || 0}`, icon: Package, color: 'bg-orange-500', trend: '' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening at LAGAAO.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {STAT_CARDS.map(({ label, value, subLabel, icon: Icon, color, trend }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              {trend && (
                <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium">
                  <ArrowUp className="w-3 h-3" /> {trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{isLoading ? '—' : value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{subLabel}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <a href="/admin/orders" className="text-sm text-primary-800 hover:underline">View All →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Order #</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.recentOrders?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-2.5 font-mono text-xs text-gray-600">{order.orderNumber}</td>
                    <td className="py-2.5">{order.user?.firstName} {order.user?.lastName?.[0]}.</td>
                    <td className="py-2.5 font-semibold">₹{Number(order.total).toLocaleString('en-IN')}</td>
                    <td className="py-2.5">
                      <span className={`badge text-xs ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-gray-500">
                      {format(new Date(order.createdAt), 'dd MMM, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Top Products</h2>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            {data?.topProducts?.map((product: any, i: number) => (
              <div key={product.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.totalSold} sold · ₹{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
