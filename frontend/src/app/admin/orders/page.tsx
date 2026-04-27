'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Package, Truck, Eye, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['admin-orders', page, filterStatus],
    queryFn: () => api.get('/orders/admin/all', { params: { page, limit: 20, status: filterStatus || undefined } }).then((d: any) => d.data),
    keepPreviousData: true,
  } as any);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/orders/admin/${id}/status`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Order status updated'); },
    onError: () => toast.error('Failed to update'),
  });

  const createShipmentMutation = useMutation({
    mutationFn: (orderId: string) => api.post(`/shipping/${orderId}/create`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Shipment created!'); },
    onError: () => toast.error('Failed to create shipment'),
  });

  const orders = data?.orders || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{data?.total || 0} total orders</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex gap-2 flex-wrap">
          {['', ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === s ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order: any) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{order.orderNumber}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{order.user?.firstName} {order.user?.lastName}</p>
                  <p className="text-xs text-gray-400">{order.user?.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{order.items?.length} item(s)</td>
                <td className="px-4 py-3 font-bold">₹{Number(order.total).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${order.payment?.status === 'CAPTURED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {order.payment?.status || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatusMutation.mutate({ id: order.id, status: e.target.value })}
                    className={`text-xs font-medium px-2 py-1 rounded border-0 cursor-pointer ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{format(new Date(order.createdAt), 'dd MMM, HH:mm')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/orders/${order.id}`} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    {['CONFIRMED', 'PROCESSING'].includes(order.status) && !order.shipment && (
                      <button onClick={() => createShipmentMutation.mutate(order.id)} className="p-1.5 hover:bg-purple-50 rounded text-purple-500" title="Create Shipment">
                        <Truck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Page {page} of {data?.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border border-gray-200 rounded disabled:opacity-50">Prev</button>
              <button disabled={page >= data?.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border border-gray-200 rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
