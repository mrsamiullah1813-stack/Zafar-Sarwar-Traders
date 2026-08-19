import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, X, Mail, Key, AlertCircle, CheckCircle, Loader2, LogOut } from 'lucide-react';
import { setAdminAuthToken, setIsAdminLoggedIn } from '../utils/storage';
import { supabase, initializeSupabaseRuntime } from '../lib/supabase';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeUserEmail, setActiveUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      // Check for an existing authenticated Supabase session
      initializeSupabaseRuntime().then(() => {
        supabase.auth.getSession().then(({ data }) => {
          if (data?.session?.user?.email) {
            setActiveUserEmail(data.session.user.email);
          }
        }).catch(() => {});
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter both Admin Email and Password.');
      return;
    }

    setLoading(true);

    try {
      await initializeSupabaseRuntime();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword
      });

      if (authError) {
        console.error('[Admin Login] Supabase Auth error:', authError);
        setError(authError.message || 'Invalid email or password. Please verify your Supabase credentials.');
        setLoading(false);
        return;
      }

      if (data?.session) {
        setAdminAuthToken(data.session.access_token);
        setIsAdminLoggedIn(true);
        setActiveUserEmail(data.user?.email || trimmedEmail);
        setSuccess('Authenticated successfully! Supabase session active.');

        setTimeout(() => {
          onLoginSuccess();
          setPassword('');
          setSuccess('');
          onClose();
        }, 500);
      } else {
        setError('No authenticated session created. Please try again.');
      }
    } catch (err: any) {
      console.error('[Admin Login] Unexpected error:', err);
      setError(err?.message || 'Failed to authenticate with Supabase. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await initializeSupabaseRuntime();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Admin Login] Sign out error:', err);
    }
    setIsAdminLoggedIn(false);
    setActiveUserEmail(null);
    onLogout();
    setLoading(false);
    onClose();
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
            Authorized management via Supabase Authentication.
          </p>
        </div>

        {isAdmin ? (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="text-left">
                <p className="font-bold">Admin Session Active</p>
                {activeUserEmail && (
                  <p className="text-[11px] text-emerald-300/90 font-mono mt-0.5">
                    User: {activeUserEmail}
                  </p>
                )}
                <p className="text-[11px] text-emerald-400/80 font-light mt-0.5">
                  Authenticated session enables category and product creation, editing, and deletion.
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-lg shadow-rose-950 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>Exit Admin Mode (Sign Out)</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="admin@zafarsarwar.com"
                  autoFocus
                  required
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter Supabase Admin Password..."
                  required
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
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
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-950 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>{loading ? 'Authenticating with Supabase...' : 'Unlock Admin Access'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

