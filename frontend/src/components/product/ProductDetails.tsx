'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart, Heart, Star, Truck, Shield, RefreshCw,
  ChevronRight, Minus, Plus, Share2, Droplets, Sun, Info
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cartApi, wishlistApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function ProductDetails({ product }: { product: any }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'desc' | 'care' | 'shipping'>('desc');

  const price = selectedVariant?.price || product.price;
  const comparePrice = product.comparePrice;
  const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
  const inStock = (product.inventory?.quantity || 0) > 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); return; }
    setLoading(true);
    try {
      await cartApi.addItem(product.id, quantity, selectedVariant?.id);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success(`Added ${quantity} × ${product.name} to cart! 🛒`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    window.location.href = '/cart';
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); return; }
    try {
      if (inWishlist) {
        await wishlistApi.remove(product.id);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistApi.add(product.id);
        setInWishlist(true);
        toast.success('Saved to wishlist ❤️');
      }
    } catch {}
  };

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-800">Home</Link>
        <ChevronRight className="w-3 h-3" />
        {product.category && (
          <>
            <Link href={`/category/${product.category.slug}`} className="hover:text-primary-800">
              {product.category.name}
            </Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-gray-900 truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3">
            {product.images?.[selectedImage] ? (
              <Image
                src={product.images[selectedImage].url}
                alt={product.images[selectedImage].altText || product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🌱</div>
            )}
            {discount > 0 && (
              <div className="absolute top-4 left-4 bg-green-600 text-white text-sm font-bold px-3 py-1 rounded">
                {discount}% OFF
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-primary-800' : 'border-gray-200'}`}
                >
                  <Image src={img.url} alt={img.altText || ''} width={64} height={64} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {/* Rating */}
          {product.totalReviews > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-sm">
                <span>{Number(product.avgRating).toFixed(1)}</span>
                <Star className="w-3.5 h-3.5 fill-white" />
              </div>
              <span className="text-sm text-gray-500">{product.totalReviews} ratings</span>
              <span className="text-sm text-gray-300">|</span>
              <a href="#reviews" className="text-sm text-primary-800 hover:underline">Read Reviews</a>
            </div>
          )}

          {/* Price */}
          <div className="mb-5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">₹{price}</span>
              {comparePrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">₹{comparePrice}</span>
                  <span className="text-lg font-bold text-green-600">{discount}% off</span>
                </>
              )}
            </div>
            {product.taxPercent > 0 && (
              <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes ({product.taxPercent}% GST)</p>
            )}
          </div>

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">Select Size/Variant</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${selectedVariant?.id === v.id ? 'border-primary-800 bg-primary-50 text-primary-800 font-medium' : 'border-gray-300 text-gray-600 hover:border-primary-400'}`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <p className="text-sm font-semibold text-gray-700">Quantity</p>
            <div className="flex items-center border border-gray-300 rounded-md">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-semibold text-sm">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.inventory?.quantity || 10, quantity + 1))} className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-gray-400">{product.inventory?.quantity || 0} available</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-lagaao-orange hover:bg-accent-light text-white font-semibold py-3 rounded-md transition-colors disabled:opacity-50"
            >
              <ShoppingCart className="w-5 h-5" />
              {loading ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!inStock}
              className="flex-1 bg-primary-800 hover:bg-primary-900 text-white font-semibold py-3 rounded-md transition-colors disabled:opacity-50"
            >
              Buy Now
            </button>
            <button onClick={handleWishlist} className={`w-12 h-12 flex items-center justify-center border rounded-md transition-colors ${inWishlist ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-300 hover:border-primary-400 text-gray-500'}`}>
              <Heart className={`w-5 h-5 ${inWishlist ? 'fill-red-500' : ''}`} />
            </button>
          </div>

          {/* Care info */}
          {(product.sunlightReq || product.wateringFreq) && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              {product.sunlightReq && (
                <div className="flex items-center gap-2 bg-yellow-50 rounded-lg p-3">
                  <Sun className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-xs text-gray-500">Sunlight</p>
                    <p className="text-sm font-medium">{product.sunlightReq}</p>
                  </div>
                </div>
              )}
              {product.wateringFreq && (
                <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
                  <Droplets className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Watering</p>
                    <p className="text-sm font-medium">{product.wateringFreq}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trust badges */}
          <div className="border border-gray-100 rounded-lg p-4 space-y-2.5">
            {[
              { icon: Truck, text: 'Free delivery on orders above ₹499' },
              { icon: Shield, text: '100% authentic plants with care guarantee' },
              { icon: RefreshCw, text: '7-day hassle-free return policy' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-gray-600">
                <Icon className="w-4 h-4 text-primary-600 flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description tabs */}
      <div className="mt-12 border-t border-gray-100 pt-8">
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {(['desc', 'care', 'shipping'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-primary-800 text-primary-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'desc' ? 'Description' : t === 'care' ? 'Care Guide' : 'Shipping'}
            </button>
          ))}
        </div>
        <div className="prose prose-sm max-w-none text-gray-600">
          {tab === 'desc' && <p>{product.description || product.shortDesc || 'No description available.'}</p>}
          {tab === 'care' && <p>{product.careInstructions || 'Care instructions not provided.'}</p>}
          {tab === 'shipping' && (
            <div>
              <p>🚚 Free delivery on orders above ₹499</p>
              <p>📦 Ships in 1-3 business days</p>
              <p>🌿 Plants are carefully packed to ensure safe delivery</p>
              <p>📍 Delivery available across India</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
