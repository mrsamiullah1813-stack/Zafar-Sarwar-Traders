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
  Briefcase
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

  const visibleContacts = contacts
    .filter(c => !c.isHidden)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const handleWhatsAppDirect = (number?: string, name?: string) => {
    const targetNumber = (number || config.whatsapp).replace(/[^0-9]/g, '');
    const greetingName = name ? `Dear ${name}` : `Hello ${config.name}`;
    const text = encodeURIComponent(`${greetingName}, I am visiting your website and would like to get in touch regarding products & pricing.`);
    window.open(`https://wa.me/${targetNumber}?text=${text}`, '_blank');
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
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                  <span>Key Contact Persons & Managers</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reach out directly to our department managers for rapid response and specialized assistance.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Showroom Team Online</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {visibleContacts.map((contact) => {
                const statusColor = 
                  contact.availabilityStatus === 'Available' ? 'bg-emerald-500 text-emerald-300 border-emerald-500/30' :
                  contact.availabilityStatus === 'Busy' ? 'bg-amber-500 text-amber-300 border-amber-500/30' :
                  'bg-slate-500 text-slate-300 border-slate-500/30';

                return (
                  <div 
                    key={contact.id} 
                    className="p-5 rounded-3xl glass-card border border-slate-800/90 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl group relative overflow-hidden"
                  >
                    {contact.isPrimary && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-500 text-slate-950 font-black text-[9px] uppercase px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>Primary</span>
                      </div>
                    )}

                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0">
                        {contact.profilePhoto ? (
                          <img 
                            src={contact.profilePhoto} 
                            alt={contact.fullName}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-700/80 shadow-md group-hover:scale-105 transition-transform" 
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-lg font-serif">
                            {contact.fullName.charAt(0)}
                          </div>
                        )}
                        <span 
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                            contact.availabilityStatus === 'Available' ? 'bg-emerald-400' :
                            contact.availabilityStatus === 'Busy' ? 'bg-amber-400' : 'bg-slate-500'
                          }`}
                          title={`Status: ${contact.availabilityStatus}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="text-white font-bold text-sm truncate group-hover:text-amber-300 transition-colors">
                          {contact.fullName}
                        </h4>
                        <div className="text-[11px] font-semibold text-amber-400/90 truncate flex items-center gap-1">
                          <Briefcase className="w-3 h-3 shrink-0" />
                          <span>{contact.designation}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {contact.department}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300 font-light">
                      {contact.workingHours && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3 text-amber-400/80" />
                          <span>{contact.workingHours}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Status:</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusColor}`}>
                          {contact.availabilityStatus}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {contact.enableWhatsapp !== false && (
                        <button
                          type="button"
                          onClick={() => handleWhatsAppDirect(contact.whatsappNumber, contact.fullName)}
                          className="w-full py-2 px-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-md active:scale-95"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>
                      )}

                      {contact.enableCall !== false && (
                        <a
                          href={`tel:${contact.mobileNumber}`}
                          className="w-full py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-md active:scale-95 text-center"
                          title="Call Mobile"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          <span>Call</span>
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
                onClick={handleWhatsAppDirect}
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
