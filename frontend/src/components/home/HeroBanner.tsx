'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: 'Bring Nature Home',
    subtitle: 'Shop Premium Money Plants',
    description: 'Air-purifying, luck-bringing, and beautiful — starting at just ₹299',
    cta: 'Shop Money Plants',
    href: '/category/money-plants',
    bg: 'from-emerald-900 via-green-800 to-emerald-700',
    emoji: '💚',
    badge: 'Up to 40% OFF',
  },
  {
    id: 2,
    title: 'Zen Bonsai Collection',
    subtitle: 'Crafted with Perfection',
    description: 'Bring tranquility to your space with our curated Bonsai collection',
    cta: 'Explore Bonsai',
    href: '/category/bonsai',
    bg: 'from-teal-900 via-emerald-800 to-teal-700',
    emoji: '🌳',
    badge: 'Free Shipping',
  },
  {
    id: 3,
    title: 'Perfect Plant Gifts 🎁',
    subtitle: 'For Every Occasion',
    description: 'Birthdays, anniversaries, housewarming — plants that keep giving',
    cta: 'Browse Gifts',
    href: '/category/gifting-plants',
    bg: 'from-green-900 via-primary-800 to-green-700',
    emoji: '🎋',
    badge: 'Gift Wrapping Available',
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className={`relative bg-gradient-to-r ${slide.bg} text-white overflow-hidden min-h-[360px] md:min-h-[440px] flex items-center transition-all duration-700`}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 text-[200px] select-none">{slide.emoji}</div>
        <div className="absolute bottom-5 left-1/3 text-[120px] select-none rotate-12">🌿</div>
      </div>

      <div className="container-custom relative z-10 py-16 md:py-20">
        <div className="max-w-lg">
          <span className="inline-block bg-lagaao-orange text-white text-sm font-bold px-3 py-1 rounded-full mb-4 animate-fade-in">
            {slide.badge}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2 leading-tight animate-slide-in">
            {slide.title}
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold text-green-200 mb-3">{slide.subtitle}</h2>
          <p className="text-green-100 text-base md:text-lg mb-8 leading-relaxed">{slide.description}</p>
          <div className="flex gap-3 flex-wrap">
            <Link href={slide.href} className="btn-accent flex items-center gap-2 text-base">
              {slide.cta} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/category/indoor-plants" className="bg-white/20 hover:bg-white/30 text-white font-medium px-6 py-2.5 rounded-md transition-colors">
              View All Plants
            </Link>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button onClick={() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={() => setCurrent((c) => (c + 1) % SLIDES.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
}
