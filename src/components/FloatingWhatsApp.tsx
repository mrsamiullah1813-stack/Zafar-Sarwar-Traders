import React, { useState } from 'react';
import { MessageSquare, X, Send, Sparkles, PhoneCall } from 'lucide-react';
import { BusinessConfig } from '../types';

interface FloatingWhatsAppProps {
  config: BusinessConfig;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ config }) => {
  const [open, setOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  const rawPhone = config.whatsapp || config.phone || '923108002863';
  const targetNumber = rawPhone.replace(/[^0-9]/g, '');
  const displayPhone = config.whatsapp || config.phone || '+92 310 8002863';

  const handleSend = () => {
    const defaultText = `Hello ${config.name || 'Zafar Sarwar Traders'}, I am interested in your luxury sanitaryware, plumbing, and building materials.`;
    const textToSend = customMsg.trim() || defaultText;
    const encoded = encodeURIComponent(textToSend);
    window.open(`https://wa.me/${targetNumber}?text=${encoded}`, '_blank');
    setOpen(false);
    setCustomMsg('');
  };

  const handleDirectClick = () => {
    const text = encodeURIComponent(`Hello ${config.name || 'Zafar Sarwar Traders'}, I am inquiring about your products and wholesale availability.`);
    window.open(`https://wa.me/${targetNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-3 sm:left-6 z-50 flex flex-col items-start safe-area-bottom">
      {/* Expanded Quick Chat Popup */}
      {open && (
        <div className="mb-4 w-[calc(100vw-2rem)] sm:w-88 max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-4 sm:p-5 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-950">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <h4 className="text-white font-bold text-xs font-serif">{config.name}</h4>
                <p className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                  <span>{displayPhone}</span> • <span>Online</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body greeting */}
          <div className="my-3 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-300 text-xs font-light space-y-1">
            <p className="font-semibold text-blue-300">Welcome to {config.name || 'Zafar Sarwar Traders'}!</p>
            <p className="text-[11px] leading-relaxed">
              Inquire about sanitaryware, Hansgrohe/Grohe faucets, CPVC pipes, paints, or cement.
            </p>
          </div>

          {/* Input & Send */}
          <div className="space-y-2">
            <input
              type="text"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your product inquiry..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />

            <button
              onClick={handleSend}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Start WhatsApp Chat ({displayPhone})</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative group p-4 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-2xl shadow-emerald-950/90 hover:scale-110 active:scale-95 transition-all duration-300 border border-emerald-400/40 flex items-center justify-center"
        title={`Chat on WhatsApp (${displayPhone})`}
      >
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-300"></span>
        </span>
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
};
