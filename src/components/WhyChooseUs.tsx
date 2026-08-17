import React from 'react';
import { 
  Award, 
  ShieldCheck, 
  DollarSign, 
  Compass, 
  Smile, 
  Building2, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const features = [
    {
      title: "Top Quality Products",
      desc: "Zero tolerance for sub-standard items. Every shower, valve, pipe, and paint bucket passes stringent factory quality control.",
      icon: Award,
      badge: "ISO Certified"
    },
    {
      title: "Trusted Brands",
      desc: "Authorized partner for global sanitary icons like Hansgrohe, Grohe, TOTO, Kohler, and leading building material manufacturers.",
      icon: ShieldCheck,
      badge: "100% Genuine"
    },
    {
      title: "Affordable Prices",
      desc: "Direct wholesale distributor pricing ensuring you get luxury sanitary fittings and cement without heavy intermediary markups.",
      icon: DollarSign,
      badge: "Best Rate Guarantee"
    },
    {
      title: "Professional Guidance",
      desc: "Our experienced team helps map out plumbing pressure calculations, shade selection, and material estimation for your site.",
      icon: Compass,
      badge: "Free Consultation"
    },
    {
      title: "Customer Satisfaction",
      desc: "Over 10,000+ satisfied homeowners, civil contractors, and commercial developers across the country.",
      icon: Smile,
      badge: "5-Star Service"
    },
    {
      title: "Complete Building Solutions",
      desc: "From initial gray-structure cement and underground CPVC piping to final luxury master bath faucets and silk paints.",
      icon: Building2,
      badge: "One-Stop Hub"
    },
  ];

  return (
    <section id="why-us" className="py-20 lg:py-28 bg-[#030712] relative overflow-hidden border-y border-slate-800/80">
      {/* Glow */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-br from-blue-900/15 via-slate-900/10 to-transparent rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3 shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Unmatched Value & Distinction</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight">
            Why Choose <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300">Zafar Sarwar Traders?</span>
          </h2>

          <p className="mt-4 text-slate-300 text-sm sm:text-base font-light leading-relaxed">
            We combine high-end luxury aesthetics with rock-solid building material reliability to bring your vision to life seamlessly.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative p-6 rounded-3xl glass-card glass-card-hover border border-slate-800/80 hover:border-blue-500/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-950/20 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-blue-400 flex items-center justify-center group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:to-cyan-500 group-hover:text-white transition-all shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-800 text-blue-300 text-[10px] font-bold tracking-wider uppercase">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors font-serif">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-slate-400 text-xs sm:text-sm leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-blue-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Guaranteed Standard</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
