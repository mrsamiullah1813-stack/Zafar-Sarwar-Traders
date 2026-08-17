import React, { useState, useEffect } from 'react';
import { X, Save, Upload, User, Phone, MessageSquare, Mail, Clock, Shield, Eye, EyeOff, Briefcase, Building2 } from 'lucide-react';
import { ContactPerson } from '../types';

interface AdminContactModalProps {
  contact: ContactPerson | null;
  onSave: (contact: ContactPerson) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const AdminContactModal: React.FC<AdminContactModalProps> = ({
  contact,
  onSave,
  onDelete,
  onClose
}) => {
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('Sanitary Manager');
  const [department, setDepartment] = useState('Sanitaryware & Showers');
  const [mobileNumber, setMobileNumber] = useState('+92 310 8002863');
  const [whatsappNumber, setWhatsappNumber] = useState('+92 310 8002863');
  const [email, setEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [workingHours, setWorkingHours] = useState('9:00 AM - 8:30 PM');
  const [availabilityStatus, setAvailabilityStatus] = useState<'Available' | 'Busy' | 'Offline'>('Available');
  const [isPrimary, setIsPrimary] = useState(false);
  const [enableWhatsapp, setEnableWhatsapp] = useState(true);
  const [enableCall, setEnableCall] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(1);

  useEffect(() => {
    if (contact) {
      setFullName(contact.fullName || '');
      setDesignation(contact.designation || 'Sanitary Manager');
      setDepartment(contact.department || 'Sanitaryware & Showers');
      setMobileNumber(contact.mobileNumber || '');
      setWhatsappNumber(contact.whatsappNumber || '');
      setEmail(contact.email || '');
      setProfilePhoto(contact.profilePhoto || '');
      setWorkingHours(contact.workingHours || '9:00 AM - 8:30 PM');
      setAvailabilityStatus(contact.availabilityStatus || 'Available');
      setIsPrimary(!!contact.isPrimary);
      setEnableWhatsapp(contact.enableWhatsapp !== false);
      setEnableCall(contact.enableCall !== false);
      setIsHidden(!!contact.isHidden);
      setDisplayOrder(contact.displayOrder || 1);
    } else {
      setFullName('');
      setDesignation('Sales Manager');
      setDepartment('Sales & Customer Care');
      setMobileNumber('+92 310 8002863');
      setWhatsappNumber('+92 310 8002863');
      setEmail('info@zafarsarwartraders.com');
      setProfilePhoto('');
      setWorkingHours('9:00 AM - 8:30 PM');
      setAvailabilityStatus('Available');
      setIsPrimary(false);
      setEnableWhatsapp(true);
      setEnableCall(true);
      setIsHidden(false);
      setDisplayOrder(Date.now());
    }
  }, [contact]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Please enter full name for contact person.');
      return;
    }

    const savedContact: ContactPerson = {
      id: contact ? contact.id : `contact-${Date.now()}`,
      fullName: fullName.trim(),
      designation: designation.trim(),
      department: department.trim(),
      mobileNumber: mobileNumber.trim(),
      whatsappNumber: whatsappNumber.trim(),
      email: email.trim(),
      profilePhoto: profilePhoto.trim(),
      workingHours: workingHours.trim(),
      availabilityStatus,
      isPrimary,
      enableWhatsapp,
      enableCall,
      isHidden,
      displayOrder
    };

    onSave(savedContact);
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-center items-start sm:items-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-auto max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-serif">
                {contact ? 'Edit Contact Person' : 'Add New Contact Person'}
              </h3>
              <p className="text-xs text-slate-400 font-light">
                Manage contact details, department, WhatsApp, availability and photo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Photo & Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Photo Upload Box */}
            <div className="space-y-3 flex flex-col items-center text-center">
              <label className="text-xs font-semibold text-slate-300">Profile Photo</label>
              <div className="relative group w-28 h-28 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 hover:border-amber-500/50 transition-colors flex flex-col items-center justify-center overflow-hidden">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 space-y-1">
                    <User className="w-8 h-8 text-slate-600" />
                    <span className="text-[10px] font-medium">Upload Photo</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={profilePhoto}
                onChange={(e) => setProfilePhoto(e.target.value)}
                placeholder="Or paste Photo URL..."
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Name, Designation & Department */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Zafar Sarwar / Muhammad Usman"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                    <span>Designation Role</span>
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Owner / CEO">Owner / CEO</option>
                    <option value="Sanitary Manager">Sanitary Manager</option>
                    <option value="Accounts Manager">Accounts Manager</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Showroom Specialist">Showroom Specialist</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Custom Role">Custom Role...</option>
                  </select>
                  {designation === 'Custom Role...' && (
                    <input
                      type="text"
                      placeholder="Type custom role title..."
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full mt-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Department</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Executive, Sanitaryware, Accounts"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Numbers & Communication */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Mobile Number</span>
              </label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+92 310 8002863"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Number</span>
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+92 310 8002863"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Email Address (Optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@zafarsarwartraders.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Working Hours</span>
              </label>
              <input
                type="text"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="e.g. 9:00 AM - 8:30 PM"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Status & Options Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Availability Status</label>
              <select
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Available">Available (Green Dot)</option>
                <option value="Busy">Busy (Yellow Dot)</option>
                <option value="Offline">Offline (Gray Dot)</option>
              </select>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Set as Primary Contact Person</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={enableWhatsapp}
                  onChange={(e) => setEnableWhatsapp(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enable Direct WhatsApp Button</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={enableCall}
                  onChange={(e) => setEnableCall(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Enable Direct Call Button</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-slate-500 focus:ring-slate-500"
                />
                {isHidden ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                <span>Hide this contact from website</span>
              </label>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            {contact && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(contact.id)}
                className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all"
              >
                Delete Contact
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-950 flex items-center gap-2 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Contact Person</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
