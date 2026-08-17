import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Headphones, Award } from 'lucide-react';

export const FeatureBar: React.FC = () => {
  const features = [
    {
      icon: Truck,
      title: 'Fast Showroom Delivery',
      description: 'Safe transport across Punjab & Pakistan'
    },
    {
      icon: RotateCcw,
      title: 'Easy Exchange & Support',
      description: 'Hassle-free product assistance'
    },
    {
      icon: ShieldCheck,
      title: '100% Genuine Brands',
      description: 'Authorized distributor for Master & Dura Max'
    },
    {
      icon: Headphones,
      title: 'Expert Technical Support',
      description: 'Dedicated sanitary & plumbing guidance'
    }
  ];

  return (
    <div className="bg-slate-900 text-white py-6 border-y border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-blue-500/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
