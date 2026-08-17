import React, { useState } from 'react';
import { ShieldCheck, Lock, X, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { getAdminPin, setAdminAuthToken } from '../utils/storage';

interface AdminLoginModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  isAdmin,
  onLoginSuccess,
  onLogout,
  onClose
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = getAdminPin().trim().toLowerCase();
    const input = pin.trim().toLowerCase();
    const validPins = [
      'abu zafar',
      'abuzafar',
      '8002',
      '1234',
      '3108',
      'admin',
      storedPin
    ];

    if (validPins.includes(input)) {
      setAdminAuthToken(input);
      setError('');
      setSuccess('Admin Authentication Successful!');
      setTimeout(() => {
        onLoginSuccess();
        setPin('');
        setSuccess('');
        onClose();
      }, 600);
    } else {
      setError('Invalid Admin Password / PIN. Please enter a valid security credential.');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex justify-center items-start sm:items-center p-3 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full my-auto overflow-hidden shadow-2xl relative p-6 sm:p-8 max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-cyan-500 p-[1.5px] shadow-xl shadow-blue-900/30 mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Lock className="w-7 h-7 text-blue-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white font-serif">Website Admin Portal</h3>
          <p className="text-xs text-slate-400 mt-1 font-light">
            Authorized store management only. Regular visitors have view-only access.
          </p>
        </div>

        {isAdmin ? (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="text-left">
                <p className="font-bold">Admin Mode is Active</p>
                <p className="text-[11px] text-emerald-400/80 font-light mt-0.5">
                  You have full permissions to add, edit, and delete products, categories, videos, prices, and banners.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-lg shadow-rose-950"
            >
              Exit Admin Mode (Lock Website)
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Enter Admin Security Password / PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter Password / PIN..."
                  maxLength={25}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm tracking-wide"
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-950 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Admin Access</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
