'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ChevronRight } from 'lucide-react';
import { cartApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const { setCart } = useCartStore();
  const queryClient = useQueryClient();

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get() as Promise<any>,
    enabled: isAuthenticated,
    select: (d: any) => d.data,
  });

  useEffect(() => {
    if (cartData) setCart(cartData);
  }, [cartData, setCart]);

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => cartApi.updateItem(id, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => toast.error('Failed to update cart'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => cartApi.removeItem(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cart'] }); toast.success('Item removed'); },
    onError: () => toast.error('Failed to remove item'),
  });

  const items = cartData?.items || [];
  const subtotal = cartData?.subtotal || 0;
  const shipping = subtotal >= 499 ? 0 : 49;
  const total = subtotal + shipping;

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <div className="container-custom py-20 text-center">
          <ShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please login to view your cart</h2>
          <Link href="/auth/login" className="btn-primary inline-block mt-4">Login</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container-custom py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Cart ({items.length} items)</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Add some plants to get started!</p>
            <Link href="/" className="btn-primary inline-block">Continue Shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="card p-4 flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 relative">
                    {item.product?.images?.[0] ? (
                      <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🌱</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.product?.slug}`} className="font-medium text-gray-900 hover:text-primary-800 line-clamp-2 text-sm">
                      {item.product?.name}
                    </Link>
                    {item.variant && <p className="text-xs text-gray-500 mt-0.5">{item.variant.name}</p>}
                    <p className="text-base font-bold text-gray-900 mt-1">₹{Number(item.price).toFixed(0)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-gray-200 rounded">
                        <button onClick={() => updateMutation.mutate({ id: item.id, quantity: item.quantity - 1 })} className="w-7 h-7 flex items-center justify-center hover:bg-gray-50">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateMutation.mutate({ id: item.id, quantity: item.quantity + 1 })} className="w-7 h-7 flex items-center justify-center hover:bg-gray-50">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-gray-900 text-sm">= ₹{(Number(item.price) * item.quantity).toFixed(0)}</span>
                      <button onClick={() => removeMutation.mutate(item.id)} className="ml-auto text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="card p-5 sticky top-24">
                <h2 className="font-bold text-gray-900 text-lg mb-4 pb-3 border-b border-gray-100">Price Details</h2>
                <div className="space-y-2.5 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({items.length} items)</span>
                    <span className="font-medium">₹{subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                      {shipping === 0 ? 'FREE' : `₹${shipping}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-green-600">Add ₹{(499 - subtotal).toFixed(0)} more for free shipping!</p>
                  )}
                </div>
                <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-3 mb-5">
                  <span>Total</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
                <Link href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2 text-base">
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/" className="text-center block mt-3 text-sm text-primary-800 hover:underline">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
