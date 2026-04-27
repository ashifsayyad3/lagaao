import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';

async function getBestSellers() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/best-sellers?limit=8`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function BestSellers() {
  const products = await getBestSellers();
  if (!products.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title">🔥 Best Sellers</h2>
          <p className="text-sm text-gray-500">Most loved by our customers</p>
        </div>
        <Link href="/products?sort=totalSold_desc" className="text-sm text-primary-800 hover:underline font-medium">
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
