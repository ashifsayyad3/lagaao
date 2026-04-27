'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, ShoppingCart, Heart, User, Menu, X, Bell, MapPin,
  ChevronDown, Leaf, Package, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useQuery } from '@tanstack/react-query';
import { aiApi, cartApi } from '@/lib/api';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { label: 'Money Plants', href: '/category/money-plants' },
  { label: 'Bonsai', href: '/category/bonsai' },
  { label: 'Indoor Plants', href: '/category/indoor-plants' },
  { label: 'Lucky Bamboo', href: '/category/lucky-bamboo' },
  { label: 'Gifting', href: '/category/gifting-plants' },
  { label: 'Planters', href: '/category/premium-planters' },
];

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, setCart } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch cart count
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get() as Promise<any>,
    enabled: isAuthenticated,
    select: (d: any) => d.data,
  });

  useEffect(() => {
    if (cartData) setCart(cartData);
  }, [cartData, setCart]);

  // Search suggestions debounce
  useEffect(() => {
    if (searchQuery.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await aiApi.suggestions(searchQuery) as any;
        setSuggestions(res.data || []);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top bar */}
      <div className="header-flipkart text-white">
        <div className="container-custom">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-800" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-wide">LAGAAO</span>
                <div className="text-xs text-green-200 italic">Explore Plants</div>
              </div>
            </Link>

            {/* Location */}
            <button className="hidden md:flex items-center gap-1 text-sm text-green-100 hover:text-white flex-shrink-0">
              <MapPin className="w-4 h-4" />
              <span>Deliver to</span>
              <span className="font-bold text-white underline">India</span>
            </button>

            {/* Search bar */}
            <div ref={searchRef} className="flex-1 relative max-w-2xl mx-2">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search for plants, bonsai, planters..."
                  className="w-full px-4 py-2.5 text-gray-900 text-sm focus:outline-none rounded-l-md"
                />
                <button type="submit" className="bg-lagaao-orange hover:bg-accent-light px-4 rounded-r-md transition-colors">
                  <Search className="w-5 h-5 text-white" />
                </button>
              </form>

              {/* Search suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-md shadow-lg z-50 mt-0.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setSearchQuery(s); setShowSuggestions(false); router.push(`/search?q=${encodeURIComponent(s)}`); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Search className="w-3.5 h-3.5 text-gray-400" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 md:gap-3">
              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 text-white hover:text-green-200 text-sm font-medium px-2 py-1.5 rounded"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden md:block">{isAuthenticated ? user?.firstName : 'Login'}</span>
                  {isAuthenticated && <ChevronDown className="w-3 h-3 hidden md:block" />}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><User className="w-4 h-4" /> My Profile</Link>
                        <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Package className="w-4 h-4" /> My Orders</Link>
                        <Link href="/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Heart className="w-4 h-4" /> Wishlist</Link>
                        <hr className="my-1" />
                        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" /> Logout</button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth/login" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Login</Link>
                        <Link href="/auth/register" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-primary-800 hover:bg-green-50">New Customer? Sign Up</Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Link href="/wishlist" className="text-white hover:text-green-200 p-1.5 relative">
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <Link href="/cart" className="flex items-center gap-1 text-white hover:text-green-200 p-1.5 relative">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {(itemCount || cartData?.itemCount || 0) > 0 && (
                    <span className="absolute -top-2 -right-2 bg-lagaao-orange text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold animate-bounce-subtle">
                      {itemCount || cartData?.itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium">Cart</span>
              </Link>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden text-white p-1.5"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div className="bg-primary-700 hidden md:block">
        <div className="container-custom">
          <div className="flex items-center gap-1 h-10 overflow-x-auto scrollbar-none">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white text-sm font-medium px-3 py-1.5 rounded hover:bg-primary-600 whitespace-nowrap transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/deals" className="text-lagaao-gold text-sm font-bold px-3 py-1.5 rounded hover:bg-primary-600 whitespace-nowrap">
              🔥 Today's Deals
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm text-gray-700 hover:text-primary-800 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
