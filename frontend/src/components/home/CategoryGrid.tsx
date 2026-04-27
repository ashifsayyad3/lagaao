import Link from 'next/link';

const CATEGORIES = [
  { name: 'Money Plants', slug: 'money-plants', emoji: '💚', desc: 'Luck & Prosperity', color: 'from-green-400 to-emerald-600' },
  { name: 'Bonsai', slug: 'bonsai', emoji: '🌳', desc: 'Zen & Tranquility', color: 'from-teal-400 to-teal-600' },
  { name: 'Indoor Plants', slug: 'indoor-plants', emoji: '🪴', desc: 'Fresh & Clean Air', color: 'from-emerald-400 to-green-600' },
  { name: 'Lucky Bamboo', slug: 'lucky-bamboo', emoji: '🎋', desc: 'Good Fortune', color: 'from-green-500 to-emerald-700' },
  { name: 'Gifting Plants', slug: 'gifting-plants', emoji: '🎁', desc: 'Perfect Gifts', color: 'from-orange-400 to-orange-600' },
  { name: 'Premium Planters', slug: 'premium-planters', emoji: '🏺', desc: 'Stylish Pots', color: 'from-amber-400 to-amber-600' },
];

export default function CategoryGrid() {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">Shop by Category</h2>
        <Link href="/categories" className="text-sm text-primary-800 hover:underline font-medium">
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 md:gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group flex flex-col items-center p-3 md:p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl md:text-3xl mb-2 group-hover:scale-110 transition-transform`}>
              {cat.emoji}
            </div>
            <span className="text-xs md:text-sm font-semibold text-gray-800 text-center leading-tight">{cat.name}</span>
            <span className="text-xs text-gray-500 hidden md:block mt-0.5">{cat.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
