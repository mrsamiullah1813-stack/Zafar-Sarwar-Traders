import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Award, 
  DollarSign, 
  Headphones, 
  Building2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BusinessConfig } from '../types';
import { CinematicSection } from './cinematic/CinematicSection';
import { Tilt3DCard } from './cinematic/Tilt3DCard';

interface AboutSectionProps {
  config: BusinessConfig;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ config }) => {
  const highlights = [
    { title: "Premium Quality Products", desc: "Handpicked European & top international certified sanitaryware, faucets, and construction materials.", icon: Award },
    { title: "Trusted Brands", desc: "Authorized stockist for Hansgrohe, Grohe, TOTO, Kohler, Dulux, FlowGuard, and Master.", icon: ShieldCheck },
    { title: "Affordable Prices", desc: "Direct factory wholesale pricing ensuring maximum value for homeowners and contractors.", icon: DollarSign },
    { title: "Professional Customer Service", desc: "Dedicated architectural & engineering specialists assisting with plans and technical specifications.", icon: Headphones },
    { title: "Modern Showroom", desc: "State-of-the-art interactive displays where you can test water flow, color shades, and finishes live.", icon: Building2 },
    { title: "Complete Building Solutions", desc: "One-stop destination for foundation cement, CPVC/UPVC piping, luxury paints, and final sanitary fittings.", icon: Sparkles },
  ];

  return (
    <CinematicSection id="about" variant="blur" className="py-20 lg:py-28 bg-[#030712] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-blue-900/20 via-slate-900/10 to-transparent rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Image Composition with 3D Depth */}
          <div className="lg:col-span-6 relative">
            <Tilt3DCard maxTilt={5} scaleOnHover={1.02}>
              <div className="relative rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl shadow-slate-950/80 group">
                <img
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
                  alt="Zafar Sarwar Traders - Luxury Sanitaryware Showroom & Bathroom Solutions Pakistan"
                  referrerPolicy="no-referrer"
                  className="w-full h-[450px] sm:h-[520px] object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/30 to-transparent" />
              </div>
            </Tilt3DCard>

            {/* Overlapping Secondary Card */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="absolute -bottom-8 -right-4 sm:right-6 max-w-xs p-5 rounded-2xl glass-card border border-blue-500/35 backdrop-blur-2xl shadow-2xl hidden sm:block z-20"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-950/90 border border-blue-800/80 text-blue-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">Modern Showroom</h4>
                  <p className="text-slate-400 text-xs mt-0.5 font-light">Live testing & full material displays</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Experience Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="absolute -top-6 -left-4 p-4 rounded-2xl bg-gradient-to-br from-blue-900/50 via-slate-900 to-slate-950 border border-blue-500/40 shadow-2xl z-20"
            >
              <span className="text-2xl font-black text-blue-300 font-serif block">20+</span>
              <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Years Excellence</span>
            </motion.div>
          </div>

          {/* Right Column - Text & Value Pillars */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <span>About Zafar Sarwar Traders</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-serif leading-tight">
              Crafting Excellence in <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300">
                Sanitaryware & Building Materials
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
              At <strong className="text-white font-semibold">{config.name}</strong>, we have earned an unmatched reputation as the premier destination for architects, developers, interior designers, and discerning homeowners. Whether you are building a modern luxury villa or an expansive commercial plaza, we deliver end-to-end building solutions with zero compromise on quality.
            </p>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08, delayChildren: 0.2 }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4"
            >
              {highlights.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={{
                      hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
                      visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6 } }
                    }}
                  >
                    <div className="glass-card glass-card-hover p-4 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all group h-full">
                      <div className="flex items-center gap-2.5 text-blue-400 mb-1.5">
                        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-white font-bold text-sm">{item.title}</h3>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed pl-9 font-light">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="pt-4 flex items-center gap-4">
              <a
                href="#contact"
                className="group relative overflow-hidden inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xl shadow-blue-950/40"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span>Visit Our Showroom</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="#why-us"
                className="text-xs text-slate-400 hover:text-blue-300 font-semibold underline underline-offset-4"
              >
                Learn Why Clients Choose Us
              </a>
            </div>

          </div>

        </div>
      </div>
    </CinematicSection>
  );
};
