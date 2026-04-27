'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, CreditCard, CheckCircle, Lock, Tag, Plus } from 'lucide-react';
import { cartApi, ordersApi, paymentsApi, couponsApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import toast from 'react-hot-toast';

declare global { interface Window { Razorpay: any; } }

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get() as Promise<any>,
    select: (d: any) => d.data,
    enabled: isAuthenticated,
  });

  const { data: addressData } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userApi.getAddresses() as Promise<any>,
    select: (d: any) => d.data,
    enabled: isAuthenticated,
    onSuccess: (addresses: any[]) => {
      const def = addresses?.find((a: any) => a.isDefault);
      if (def) setSelectedAddress(def.id);
    },
  } as any);

  const addresses = addressData || [];
  const cartItems = cartData?.items || [];
  const subtotal = cartData?.subtotal || 0;
  const shipping = subtotal >= 499 ? 0 : 49;
  const total = subtotal + shipping - couponDiscount;

  const applyCoupon = async () => {
    try {
      const res = await couponsApi.validate(couponCode, subtotal) as any;
      if (res.data?.valid) {
        setCouponDiscount(res.data.discount);
        setCouponApplied(true);
        toast.success(`Coupon applied! You save ₹${res.data.discount}`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Invalid coupon');
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: () => ordersApi.create({ addressId: selectedAddress, couponCode: couponApplied ? couponCode : undefined, notes }) as Promise<any>,
    onSuccess: async (res: any) => {
      const order = res.data;
      setOrderId(order.id);
      await initiatePayment(order.id, order.total);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create order'),
  });

  const initiatePayment = async (orderId: string, amount: number) => {
    try {
      const res = await paymentsApi.createOrder(orderId) as any;
      const rzp = res.data;

      const options = {
        key: rzp.key,
        amount: rzp.amount,
        currency: rzp.currency,
        name: 'LAGAAO',
        description: `Order #${rzp.orderNumber}`,
        order_id: rzp.razorpayOrderId,
        handler: async (response: any) => {
          try {
            await paymentsApi.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId,
            });
            toast.success('Payment successful! 🎉');
            router.push(`/orders/${orderId}?success=true`);
          } catch {
            toast.error('Payment verification failed');
          }
        },
        prefill: { name: `${user?.firstName} ${user?.lastName || ''}`, email: user?.email },
        theme: { color: '#2d6a4f' },
        modal: { ondismiss: () => toast.error('Payment cancelled') },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err: any) {
      toast.error(err?.message || 'Payment initialization failed');
    }
  };

  return (
    <>
      <Header />
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <main className="container-custom py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Address */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-primary-800 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <h2 className="text-lg font-bold">Delivery Address</h2>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 mb-4">No saved addresses</p>
                  <button onClick={() => router.push('/profile?tab=addresses')} className="btn-outline text-sm flex items-center gap-1 mx-auto">
                    <Plus className="w-4 h-4" /> Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr: any) => (
                    <label key={addr.id} className={`flex gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedAddress === addr.id ? 'border-primary-800 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="address" value={addr.id} checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{addr.fullName}</span>
                          <span className="badge badge-green text-xs">{addr.type}</span>
                          {addr.isDefault && <span className="badge bg-primary-100 text-primary-800 text-xs">Default</span>}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                        <p className="text-sm text-gray-600">{addr.city}, {addr.state} — {addr.pincode}</p>
                        <p className="text-sm text-gray-500 mt-0.5">📞 {addr.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Notes */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-primary-800 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <h2 className="text-lg font-bold">Delivery Notes (Optional)</h2>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special delivery instructions..."
                rows={2}
                className="input-field resize-none text-sm"
              />
            </div>

            {/* Coupon */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-primary-800" />
                <h2 className="text-lg font-bold">Apply Coupon</h2>
              </div>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  disabled={couponApplied}
                  className="input-field flex-1"
                />
                <button
                  onClick={couponApplied ? () => { setCouponApplied(false); setCouponDiscount(0); setCouponCode(''); } : applyCoupon}
                  className={couponApplied ? 'btn-outline text-red-600 border-red-300 hover:bg-red-50' : 'btn-primary'}
                >
                  {couponApplied ? 'Remove' : 'Apply'}
                </button>
              </div>
              {couponApplied && (
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" /> Coupon applied! You save ₹{couponDiscount}
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-24">
              <h2 className="font-bold text-lg mb-4 pb-3 border-b border-gray-100">Order Summary</h2>
              <div className="space-y-3 mb-4 max-h-52 overflow-y-auto">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex gap-2 text-sm">
                    <span className="text-gray-500 flex-1 truncate">{item.product?.name} × {item.quantity}</span>
                    <span className="font-medium">₹{(Number(item.price) * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-₹{couponDiscount}</span></div>}
              </div>
              <div className="flex justify-between font-bold text-base border-t border-gray-100 mt-3 pt-3">
                <span>Total</span><span>₹{total.toFixed(0)}</span>
              </div>

              <button
                onClick={() => createOrderMutation.mutate()}
                disabled={!selectedAddress || createOrderMutation.isPending || cartItems.length === 0}
                className="btn-primary w-full mt-5 flex items-center justify-center gap-2 text-base py-3"
              >
                <Lock className="w-4 h-4" />
                {createOrderMutation.isPending ? 'Processing...' : `Pay ₹${total.toFixed(0)}`}
              </button>

              <div className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-400">
                <Lock className="w-3 h-3" /> Secured by Razorpay
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
