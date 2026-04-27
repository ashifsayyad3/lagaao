import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import BestSellers from '@/components/home/BestSellers';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import AIPlantBot from '@/components/shared/AIPlantBot';

export const metadata: Metadata = {
  title: 'LAGAAO - Buy Plants Online | Money Plants, Bonsai, Indoor Plants',
  description: 'Shop premium plants online. Money plants, Bonsai, Indoor plants, Lucky Bamboo delivered to your door. Fast shipping across India.',
};

export const revalidate = 300; // ISR — revalidate every 5 minutes

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroBanner />
        <div className="container-custom py-8 space-y-12">
          <CategoryGrid />
          <FeaturedProducts />
          <WhyChooseUs />
          <BestSellers />
        </div>
      </main>
      <Footer />
      <AIPlantBot />
    </>
  );
}
