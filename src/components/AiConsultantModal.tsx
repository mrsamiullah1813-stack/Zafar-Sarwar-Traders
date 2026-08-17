import React, { useState } from 'react';
import { Sparkles, X, MessageSquare, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { BusinessConfig, AiRecommendationResponse } from '../types';

interface AiConsultantModalProps {
  config: BusinessConfig;
  onClose: () => void;
}

export const AiConsultantModal: React.FC<AiConsultantModalProps> = ({ config, onClose }) => {
  const [projectType, setProjectType] = useState('Villa / Residential Residence');
  const [roomsCount, setRoomsCount] = useState(3);
  const [aestheticStyle, setAestheticStyle] = useState('Modern Minimalist Matte Black & Gold');
  const [budgetLevel, setBudgetLevel] = useState('Ultra Luxury European Standard');
  const [customDetails, setCustomDetails] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiRecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType,
          roomsCount,
          aestheticStyle,
          budgetLevel,
          customDetails
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to generate consultancy plan.');
      }
    } catch (err: any) {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportWhatsApp = () => {
    if (!result) return;
    const msg = `Hello ${config.name},
I used your AI Material & Bathroom Estimator for my project.

Project: ${projectType} (${roomsCount} Bathrooms)
Style: ${aestheticStyle}

Recommended Categories: ${(result.recommendedCategories || []).join(', ')}

WhatsApp Summary:
${result.whatsappSummary || result.summary || ''}

Please share complete itemized pricing for these recommended specs!`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${config.whatsapp.replace(/[^0-9]/g, '')}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-700 to-cyan-500 text-white shadow-lg shadow-blue-900/50">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-serif">
              AI Bathroom & Building Material Planner
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Powered by Gemini 2.5 Flash • Get instant tailored specs & WhatsApp export
            </p>
          </div>
        </div>

        {!result ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="Villa / Residential Residence">Villa / Residential Residence</option>
                  <option value="Commercial Building / Plaza">Commercial Building / Plaza</option>
                  <option value="Apartment Complex">Apartment Complex</option>
                  <option value="Single Master Bath Remodel">Single Master Bath Remodel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Number of Bathrooms / Units</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Aesthetic Style</label>
                <select
                  value={aestheticStyle}
                  onChange={(e) => setAestheticStyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="Modern Minimalist Matte Black & Gold">Modern Minimalist Matte Black & Gold</option>
                  <option value="Classic European Chrome & Marble">Classic European Chrome & Marble</option>
                  <option value="Brushed Titanium Industrial Spa">Brushed Titanium Industrial Spa</option>
                  <option value="High-Durability Commercial Standard">High-Durability Commercial Standard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Budget Scale</label>
                <select
                  value={budgetLevel}
                  onChange={(e) => setBudgetLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="Ultra Luxury European Standard">Ultra Luxury European Standard</option>
                  <option value="Premium Quality Best Value">Premium Quality Best Value</option>
                  <option value="Wholesale Commercial Bulk">Wholesale Commercial Bulk</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Notes / Floor Area Specs</label>
              <textarea
                rows={3}
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                placeholder="e.g., Looking for concealed thermostatic valves, weather-shield paint for 4000 sq ft exterior, and CPVC piping..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating Recommendations...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Material Specification Plan</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-blue-950/50 border border-blue-500/30">
              <h4 className="text-white font-bold text-base font-serif text-blue-300">
                {result.headline}
              </h4>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                {result.overview}
              </p>
            </div>

            {result.recommendedCategories && result.recommendedCategories.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Recommended Product Categories:</span>
                <div className="flex flex-wrap gap-2">
                  {result.recommendedCategories.map((cat, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-blue-300 text-xs font-medium">
                      ✔ {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.keyProducts && result.keyProducts.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Key Suggested Fittings & Supplies:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.keyProducts.map((prod, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="text-white font-bold">{prod.name}</div>
                      <div className="text-blue-400 text-[11px] mt-0.5">{prod.whyItFits}</div>
                      <div className="text-slate-400 text-[10px] mt-1">{prod.estimatedSpecs}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.estimatedMaterialTip && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-amber-400 block mb-0.5">💡 Expert Tip:</span>
                {result.estimatedMaterialTip}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setResult(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Modify Project Parameters
              </button>

              <button
                onClick={handleExportWhatsApp}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Export Plan & Request WhatsApp Pricing</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
