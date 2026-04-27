import { Truck, Shield, Leaf, HeadphonesIcon, RefreshCw, Award } from 'lucide-react';

const FEATURES = [
  { icon: Truck, title: 'Free Delivery', desc: 'On orders above ₹499', color: 'text-blue-600 bg-blue-50' },
  { icon: Shield, title: '100% Authentic', desc: 'Genuine, healthy plants', color: 'text-green-600 bg-green-50' },
  { icon: Leaf, title: 'Expert Care Guide', desc: 'Free care instructions with every plant', color: 'text-emerald-600 bg-emerald-50' },
  { icon: RefreshCw, title: '7-Day Returns', desc: 'Hassle-free return policy', color: 'text-purple-600 bg-purple-50' },
  { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Plant experts always available', color: 'text-orange-600 bg-orange-50' },
  { icon: Award, title: 'Premium Quality', desc: 'Curated from the best nurseries', color: 'text-yellow-600 bg-yellow-50' },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8">
      <h2 className="section-title text-center mb-2">Why Choose LAGAAO?</h2>
      <p className="text-center text-gray-500 mb-8">We care for your plants as much as you do</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {FEATURES.map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm">
            <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
