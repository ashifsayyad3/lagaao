'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Star, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cartApi, wishlistApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  avgRating: number;
  totalReviews: number;
  images: { url: string; altText?: string }[];
  inventory?: { quantity: number };
  isFeatured?: boolean;
}

interface Props {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className = '' }: Props) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [inWishlist, setInWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const inStock = (product.inventory?.quantity || 0) > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to add to cart'); return; }
    setAddingToCart(true);
    try {
      await cartApi.addItem(product.id, 1);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success(`${product.name} added to cart! 🛒`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to save items'); return; }
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
    <Link href={`/product/${product.slug}`} className={`product-card group ${className}`}>
      <div className="relative overflow-hidden">
        <div className="aspect-[4/3] bg-gray-50 relative">
          {product.images?.[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].altText || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-green-50">
              <span className="text-5xl">🌱</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              {discount}% OFF
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-lagaao-orange text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
              <Zap className="w-3 h-3" /> Top Pick
            </span>
          )}
          {!inStock && (
            <span className="bg-gray-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1.5 group-hover:text-primary-800 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.totalReviews > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex items-center gap-0.5 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">
              <span>{Number(product.avgRating).toFixed(1)}</span>
              <Star className="w-3 h-3 fill-white" />
            </div>
            <span className="text-xs text-gray-400">({product.totalReviews})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base font-bold text-gray-900">₹{product.price}</span>
          {product.comparePrice && (
            <span className="text-xs text-gray-400 line-through">₹{product.comparePrice}</span>
          )}
          {discount > 0 && (
            <span className="text-xs font-semibold text-green-700">{discount}% off</span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock || addingToCart}
          className="w-full flex items-center justify-center gap-1.5 bg-primary-800 hover:bg-primary-900 text-white text-sm font-medium py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {addingToCart ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </Link>
  );
}
