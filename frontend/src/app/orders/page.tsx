'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight, Clock } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-gray-100 text-gray-800',
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll({ limit: 20 }) as Promise<any>,
    select: (d: any) => d.data,
    enabled: isAuthenticated,
  });

  const orders = data?.orders || [];

  return (
    <>
      <Header />
      <main className="container-custom py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="h-4 skeleton rounded w-1/3" />
                <div className="h-3 skeleton rounded w-1/4" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No orders yet</h2>
            <Link href="/" className="btn-primary inline-block mt-4">Start Shopping</Link>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((order: any) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="card p-5 block hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'} text-xs`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div className="flex gap-3 text-sm text-gray-600">
                <span>{order.items?.length || 0} item(s)</span>
                <span>•</span>
                <span className="font-semibold text-gray-900">₹{Number(order.total).toFixed(0)}</span>
                {order.shipment && (
                  <>
                    <span>•</span>
                    <span className="text-primary-800">{order.shipment.status.replace(/_/g, ' ')}</span>
                  </>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                {order.items?.slice(0, 3).map((item: any) => (
                  <span key={item.id} className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-600">
                    {item.productName}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
