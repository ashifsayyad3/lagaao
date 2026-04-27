import Link from 'next/link';
import { Leaf, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const FOOTER_LINKS = {
  'About': [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Blog', href: '/blog' },
  ],
  'Help': [
    { label: 'FAQ', href: '/faq' },
    { label: 'Shipping Policy', href: '/shipping-policy' },
    { label: 'Return Policy', href: '/return-policy' },
    { label: 'Track Order', href: '/track-order' },
  ],
  'Plants': [
    { label: 'Money Plants', href: '/category/money-plants' },
    { label: 'Bonsai', href: '/category/bonsai' },
    { label: 'Indoor Plants', href: '/category/indoor-plants' },
    { label: 'Lucky Bamboo', href: '/category/lucky-bamboo' },
  ],
  'Legal': [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Sitemap', href: '/sitemap.xml' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary-800 rounded-full flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold">LAGAAO</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              India's premium online plant marketplace. Bringing nature home with love, care, and expertise.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary-400" /><span>hello@lagaao.com</span></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary-400" /><span>+91 98765 43210</span></div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-400" /><span>Mumbai, Maharashtra, India</span></div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              {[
                { Icon: Facebook, href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: Twitter, href: '#' },
                { Icon: Youtube, href: '#' },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href} className="w-8 h-8 bg-gray-700 hover:bg-primary-700 rounded-full flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} LAGAAO.COM — All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <img src="/payment-icons/razorpay.svg" alt="Razorpay" className="h-6 opacity-60 hover:opacity-100 transition-opacity" />
            <div className="text-xs text-gray-500">Secure payments powered by Razorpay</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
