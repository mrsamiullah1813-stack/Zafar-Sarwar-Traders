import React, { useState } from 'react';
import { 
  ChevronDown, 
  Sparkles, 
  HelpCircle, 
  Search 
} from 'lucide-react';
import { FaqItem } from '../types';

interface FaqSectionProps {
  faqs: FaqItem[];
}

export const FaqSection: React.FC<FaqSectionProps> = ({ faqs }) => {
  const safeFaqs = Array.isArray(faqs) ? faqs : [];
  const [openId, setOpenId] = useState<string | null>(safeFaqs[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const q = (searchTerm || '').toLowerCase();
  const filteredFaqs = safeFaqs.filter(
    (faq) =>
      faq &&
      (((faq.question || '').toLowerCase().includes(q)) ||
      ((faq.answer || '').toLowerCase().includes(q)))
  );

  return (
    <section id="faq" className="py-20 lg:py-28 bg-[#030712] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-blue-900/15 via-slate-900/10 to-transparent rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3 shadow-xl">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Got Questions? We Have Answers</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight">
            Frequently Asked <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-sky-300 to-cyan-300">Questions</span>
          </h2>

          <p className="mt-3 text-slate-300 text-sm font-light leading-relaxed">
            Everything you need to know about our sanitary products, warranties, pricing, and construction logistics.
          </p>

          {/* Search Box */}
          <div className="mt-6 max-w-md mx-auto relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/90 border border-slate-800/90 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors shadow-xl"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-3xl glass-card border border-slate-800/80 hover:border-amber-500/30 transition-all duration-300 overflow-hidden shadow-xl"
              >
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-amber-300 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="font-serif">{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-amber-400 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 pt-1 sm:px-6 text-slate-300 text-xs sm:text-sm font-light leading-relaxed border-t border-slate-800/60 animate-fadeIn">
                    <p>{faq.answer}</p>
                    <div className="mt-3 text-[11px] font-mono text-amber-400">
                      Category: {faq.category}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
