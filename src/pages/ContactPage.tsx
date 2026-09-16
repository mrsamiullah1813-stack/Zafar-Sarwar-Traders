import React, { useState } from 'react';
import { MapPin, Phone, MessageCircle, Mail, Clock, Send, CheckCircle2, UserCheck } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { BusinessConfig, ContactPerson } from '../types';

interface ContactPageProps {
  config: BusinessConfig;
  contacts?: ContactPerson[];
  onNavigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ config, contacts = [], onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    subject: 'Sanitaryware Quotation',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const rawPhone = config?.whatsapp || config?.phone || '923108002863';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      `Hello ${config?.name || 'Zafar Sarwar Traders'},\nMy Name: ${formData.name || 'Customer'}\nCity: ${formData.city || 'Pakistan'}\nPhone: ${formData.phone || '-'}\nSubject: ${formData.subject}\nMessage: ${formData.message || 'I would like an estimate for sanitary & construction supplies.'}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: 'Contact Us', active: true }]}
        onNavigateHome={() => onNavigate('/')}
      />

      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Phone className="w-3.5 h-3.5" />
            <span>CUSTOMER SUPPORT & SHOWROOM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight">
            Contact Zafar Sarwar Traders
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Reach out for wholesale trade quotations, project bulk pricing, technical product specifications, or physical showroom visits in Chiniot.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: CONTACT DETAILS & SHOWROOM INFO */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                Direct Contact Points
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Phone & WhatsApp</div>
                    <div className="text-slate-600 mt-0.5">{config?.phone || '+92 310 8002863'}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">Quick response within business hours</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">WhatsApp Instant Ordering</div>
                    <div className="text-slate-600 mt-0.5">+{cleanPhone}</div>
                    <button
                      type="button"
                      onClick={handleWhatsAppInquiry}
                      className="mt-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat on WhatsApp</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Email Address</div>
                    <div className="text-slate-600 mt-0.5">{config?.email || 'support@zafarsarwartraders.shop'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Showroom Location</div>
                    <div className="text-slate-600 mt-0.5">{config?.address || 'Near Railway Road, Main Bazar, Chiniot, Punjab, Pakistan'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Showroom Hours</div>
                    <div className="text-slate-600 mt-0.5">Sat – Thu: 8:30 AM – 8:30 PM</div>
                    <div className="text-slate-600 mt-0.5">Friday: 2:30 PM – 8:30 PM</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Personnel */}
            {contacts && contacts.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Showroom Contact Personnel</span>
                </h3>
                <div className="space-y-2">
                  {contacts.map((person, idx) => (
                    <div key={person.id || idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{person.fullName}</div>
                        <div className="text-slate-500">{person.designation} {person.department ? `(${person.department})` : ''}</div>
                      </div>
                      {person.mobileNumber && (
                        <a href={`tel:${person.mobileNumber}`} className="text-blue-600 font-bold hover:underline">
                          {person.mobileNumber}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: INQUIRY & QUOTATION FORM */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
              
              <div>
                <h2 className="text-xl font-bold font-serif text-slate-900">
                  Request Quotation or Product Details
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Fill out the details below and our team will get in touch with item availability and wholesale rates.
                </p>
              </div>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-bold text-emerald-900">Thank you for your inquiry!</h3>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    We have received your message. You can also send this inquiry directly via WhatsApp for an immediate response.
                  </p>
                  <button
                    type="button"
                    onClick={handleWhatsAppInquiry}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send via WhatsApp Now</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Muhammad Usman"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Phone / WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. 0300 1234567"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Delivery City *</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Chiniot, Faisalabad, Lahore"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Subject / Requirement</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 cursor-pointer"
                      >
                        <option value="Sanitaryware Quotation">Sanitaryware Quotation</option>
                        <option value="Bathroom Fittings & Mixers">Bathroom Fittings & Mixers</option>
                        <option value="Pipes & Plumbing Bulk Supply">Pipes & Plumbing Bulk Supply</option>
                        <option value="Water Storage Tanks">Water Storage Tanks</option>
                        <option value="Paints & Exterior Coats">Paints & Exterior Coats</option>
                        <option value="Other Wholesale Inquiries">Other Wholesale Inquiries</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Message / List of Items</label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="List the products, models, or approximate quantities you need..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 resize-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleWhatsAppInquiry}
                      className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Submit via WhatsApp</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
