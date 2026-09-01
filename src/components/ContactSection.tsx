import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  MessageSquare, 
  Mail, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Building2,
  Navigation,
  ExternalLink,
  UserCheck,
  Shield,
  Briefcase,
  Crown,
  Check,
  Copy,
  ArrowUpRight,
  PhoneCall,
  BadgeCheck
} from 'lucide-react';
import { BusinessConfig, ContactPerson } from '../types';

interface ContactSectionProps {
  config: BusinessConfig;
  contacts?: ContactPerson[];
}

export const ContactSection: React.FC<ContactSectionProps> = ({ config, contacts = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    category: 'Sanitaryware & Showers',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const visibleContacts = contacts
    .filter(c => !c.isHidden)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const handleWhatsAppDirect = (number?: string, name?: string) => {
    const targetNumber = (number || config.whatsapp).replace(/[^0-9]/g, '');
    const greetingName = name ? `Dear ${name}` : `Hello ${config.name}`;
    const text = encodeURIComponent(`${greetingName}, I am visiting your website and would like to get in touch regarding products & pricing.`);
    window.open(`https://wa.me/${targetNumber}?text=${text}`, '_blank');
  };

  const handleCopyNumber = (phone: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedPhone(id);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(`Hello ${config.name},
Inquiry from Website:
- Name: ${formData.name}
- Phone: ${formData.phone}
- Category of Interest: ${formData.category}
- Message: ${formData.message}`);

    window.open(`https://wa.me/${config.whatsapp.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-[#030712] relative overflow-hidden border-t border-slate-800/80">
      {/* Background Lighting */}
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-gradient-to-bl from-blue-900/15 via-slate-900/10 to-transparent rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3 shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Connect With Our Showroom Experts</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight">
            Visit Us or <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-sky-300 to-cyan-300">Get an Instant Quote</span>
          </h2>

          <p className="mt-3 text-slate-300 text-sm font-light leading-relaxed">
            Our showroom specialists are ready to assist you with product selection, technical drawings, pricing, and fast site delivery.
          </p>
        </div>

        {/* Dynamic Personnel Contacts Grid */}
        {visibleContacts.length > 0 && (
          <div className="space-y-6 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-800/80 pb-4 gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-semibold uppercase tracking-wider mb-2">
                  <BadgeCheck className="w-3 h-3 text-amber-400" />
                  <span>Verified Showroom Leadership</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-white flex items-center gap-2.5">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                  <span>Key Contact Persons & Department Specialists</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl font-light">
                  Reach out directly to our department managers and leadership for rapid quotes, technical assistance, and instant order dispatch.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 shadow-sm shrink-0 self-start sm:self-auto">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium text-slate-200">Showroom Team Online</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {visibleContacts.map((contact) => {
                const statusColor = 
                  contact.availabilityStatus === 'Available' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                  contact.availabilityStatus === 'Busy' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                  'bg-slate-500/15 text-slate-300 border-slate-500/30';

                return (
                  <div 
                    key={contact.id} 
                    className="group relative rounded-3xl bg-gradient-to-b from-[#0d1527]/95 via-[#080d19]/95 to-[#040710]/98 border border-slate-800/80 hover:border-amber-500/50 p-5 sm:p-6 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_40px_-8px_rgba(245,158,11,0.12)] flex flex-col justify-between space-y-4 overflow-hidden"
                  >
                    {/* Top ambient highlight line */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {contact.isPrimary && (
                      <div className="absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md shadow-xs">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>Executive</span>
                      </div>
                    )}

                    {/* Profile Header */}
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        <div className="p-0.5 rounded-2xl bg-gradient-to-b from-amber-500/40 via-slate-700/60 to-slate-800/90 shadow-md group-hover:from-amber-400/60 group-hover:to-amber-500/40 transition-colors">
                          {contact.profilePhoto ? (
                            <img 
                              src={contact.profilePhoto} 
                              alt={contact.fullName}
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                          ) : (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center text-amber-400 font-bold text-xl font-serif">
                              {contact.fullName.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Availability Beacon */}
                        <span 
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#040710] flex items-center justify-center ${
                            contact.availabilityStatus === 'Available' ? 'bg-emerald-500' :
                            contact.availabilityStatus === 'Busy' ? 'bg-amber-500' : 'bg-slate-500'
                          }`}
                          title={`Status: ${contact.availabilityStatus}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full bg-white ${contact.availabilityStatus === 'Available' ? 'animate-pulse' : ''}`} />
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="text-white font-bold text-base font-serif tracking-tight group-hover:text-amber-300 transition-colors line-clamp-1">
                          {contact.fullName}
                        </h4>
                        
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
                          <Briefcase className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{contact.designation}</span>
                        </div>

                        <div className="text-[11px] text-slate-400 font-medium truncate mt-1">
                          {contact.department}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs">
                      {contact.workingHours && (
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3 text-amber-400/80" />
                            <span>Hours:</span>
                          </span>
                          <span className="text-slate-300 font-medium">{contact.workingHours}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Availability:</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusColor}`}>
                          {contact.availabilityStatus}
                        </span>
                      </div>

                      {/* Direct Phone Number Bar */}
                      <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] truncate">
                          <PhoneCall className="w-3 h-3 text-amber-400/80 shrink-0" />
                          <span className="truncate">{contact.mobileNumber}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleCopyNumber(contact.mobileNumber, contact.id, e)}
                          className="shrink-0 text-[10px] text-slate-400 hover:text-amber-300 px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copy phone number"
                        >
                          {copiedPhone === contact.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Direct Contact Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {contact.enableWhatsapp !== false && (
                        <button
                          type="button"
                          onClick={() => handleWhatsAppDirect(contact.whatsappNumber, contact.fullName)}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                          title="Chat directly on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-100" />
                          <span>WhatsApp</span>
                        </button>
                      )}

                      {contact.enableCall !== false && (
                        <a
                          href={`tel:${contact.mobileNumber}`}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] text-center"
                          title="Call Mobile Number"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          <span>Call Direct</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column - Contact Info Cards & Map */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Address */}
            <div className="p-6 rounded-3xl glass-card border border-slate-800/80 flex items-start gap-4 shadow-xl">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-sm flex items-center gap-1.5 font-serif">
                  <span>Showroom Address</span>
                </h4>
                <p className="text-slate-200 text-xs mt-1 font-light leading-relaxed">
                  {config.address}
                </p>
                <a
                  href="https://maps.app.goo.gl/NKv1i28dGbyLzudR6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions on Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Phone & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href={`tel:${config.phone}`}
                className="p-5 rounded-3xl glass-card border border-slate-800/80 hover:border-amber-500/30 transition-all flex items-center gap-3 shadow-xl"
              >
                <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-amber-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Call Hotline</div>
                  <div className="text-white font-bold text-xs">{config.phone}</div>
                </div>
              </a>

              <button
                onClick={() => handleWhatsAppDirect()}
                className="p-5 rounded-3xl glass-card border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex items-center gap-3 text-left shadow-xl"
              >
                <div className="p-2.5 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-emerald-400 uppercase font-semibold">WhatsApp 24/7</div>
                  <div className="text-white font-bold text-xs">{config.whatsapp}</div>
                </div>
              </button>
            </div>

            {/* Email & Business Hours */}
            <div className="p-6 rounded-3xl glass-card border border-slate-800/80 space-y-3 shadow-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-300 text-xs font-light">{config.email}</span>
              </div>
              <div className="flex items-start gap-3 pt-3 border-t border-slate-800/60">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-0.5 font-light">
                  <div>{config.hoursWeekday}</div>
                  <div className="text-slate-400">{config.hoursSunday}</div>
                </div>
              </div>
            </div>

            {/* Embedded Official Google Map Container */}
            <div className="rounded-3xl overflow-hidden border border-slate-800/80 glass-card shadow-2xl p-2.5 relative space-y-2.5">
              <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-800/80">
                <iframe
                  title="Zafar Sarwar Traders Official Location Map"
                  src="https://maps.google.com/maps?q=https://maps.app.goo.gl/NKv1i28dGbyLzudR6&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full filter contrast-110 saturate-110 hover:contrast-120 transition-all duration-300"
                />

                {/* Glassmorphism Map Badge Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950/90 border border-slate-800/90 backdrop-blur-md shadow-xl pointer-events-auto">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white font-serif">Zafar Sarwar Traders</h5>
                      <p className="text-[10px] text-slate-400">Official Showroom Location</p>
                    </div>
                  </div>

                  <a
                    href="https://maps.app.goo.gl/NKv1i28dGbyLzudR6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-[11px] font-black shadow-md shadow-amber-950/30 flex items-center gap-1.5 transition-all shrink-0 hover:scale-105 active:scale-95"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>

              {/* Responsive Bottom Directions Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] text-slate-300 font-medium">Jhummrah Chowk, Jhang Road, Chiniot • Official Store</span>
                </div>
                <a
                  href="https://maps.app.goo.gl/NKv1i28dGbyLzudR6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/30 flex items-center justify-center gap-2 transition-all shrink-0 hover:scale-[1.02] active:scale-98"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>

          {/* Right Column - Interactive WhatsApp Inquiry Form */}
          <div className="lg:col-span-7 p-8 rounded-3xl glass-card border border-slate-800/80 shadow-2xl relative">
            <h3 className="text-2xl font-bold text-white font-serif mb-2">
              Send Direct Inquiry
            </h3>
            <p className="text-slate-400 text-xs mb-8 font-light">
              Fill out your project requirements below to automatically launch WhatsApp with your pre-formatted order request.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. M. Hassan"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +92 300 0000000"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department / Product Line</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="Sanitaryware & Luxury Bath">Sanitaryware & Luxury Bath</option>
                  <option value="Designer Faucets & Rain Showers">Designer Faucets & Rain Showers</option>
                  <option value="Waterproof Vanities & Mirrors">Waterproof Vanities & Mirrors</option>
                  <option value="Pipes (CPVC, UPVC, PPR) & Pumps">Pipes (CPVC, UPVC, PPR) & Pumps</option>
                  <option value="Paints & Wall Putty">Paints & Wall Putty</option>
                  <option value="Cement, Sand & Structural Steel">Cement, Sand & Structural Steel</option>
                  <option value="Full Building Project Requirement">Full Building Project Requirement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Details or Items Required</label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="e.g. I need 4 wall-hung toilets, 4 thermostatic shower panels, and 100 bags of 53-grade cement delivered to Phase 6..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm tracking-wide transition-all shadow-xl shadow-emerald-950/40 hover:scale-[1.01] active:scale-99"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Dispatch Inquiry via WhatsApp</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Instant Click-to-Chat API Response</span>
              </span>
              <span>100% Confidential</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
