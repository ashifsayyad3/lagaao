import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/providers';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'LAGAAO - Buy Plants Online | Money Plants, Bonsai, Indoor Plants',
    template: '%s | LAGAAO',
  },
  description: 'Shop premium plants online at LAGAAO. Money plants, Bonsai, Indoor plants, Lucky Bamboo, Gifting plants & Premium Planters. Fast delivery across India.',
  keywords: ['buy plants online', 'money plant', 'bonsai', 'indoor plants', 'lucky bamboo', 'plant nursery'],
  authors: [{ name: 'LAGAAO' }],
  creator: 'LAGAAO',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lagaao.com'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://lagaao.com',
    siteName: 'LAGAAO',
    title: 'LAGAAO - Buy Plants Online',
    description: 'Shop premium plants online. Money plants, Bonsai, Indoor plants delivered to your door.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'LAGAAO Plant Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LAGAAO - Buy Plants Online',
    description: 'Shop premium plants online at LAGAAO.',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
