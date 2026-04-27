import Link from 'next/link';
import { productsApi } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';

async function getFeaturedProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/featured?limit=8`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title">🌟 Featured Plants</h2>
          <p className="text-sm text-gray-500">Handpicked by our plant experts</p>
        </div>
        <Link href="/products?featured=true" className="text-sm text-primary-800 hover:underline font-medium">
          View All →
        </Link>
      </div>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card">
              <div className="aspect-[4/3] skeleton" />
              <div className="p-3 space-y-2">
                <div className="h-4 skeleton rounded w-3/4" />
                <div className="h-3 skeleton rounded w-1/2" />
                <div className="h-8 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
