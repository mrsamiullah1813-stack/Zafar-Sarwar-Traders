import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, X, Mail, Key, AlertCircle, CheckCircle, Loader2, LogOut, Volume2, VolumeX, Sparkles, ArrowLeft } from 'lucide-react';
import { setAdminAuthToken, setIsAdminLoggedIn, getAdminPin } from '../utils/storage';
import { supabase, initializeSupabaseRuntime } from '../lib/supabase';
import { speakAdminVoice, getAdminVoicePreference, setAdminVoicePreference } from '../utils/adminVoice';
import { AIAssistantAvatar, AIAssistantMood } from './AIAssistantAvatar';

interface AdminLoginModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  onClose: () => void;
}

// =========================================================
// RESILIENT CLIENT-SIDE SECURITY PIN & PAKISTAN TIME PIN VALIDATION
// =========================================================
function getValidClientSecurityPins(referenceDate: Date = new Date()): Set<string> {
  const validPins = new Set<string>();
  const nowMs = referenceDate.getTime();
  // Check current time with ±5 min window (300 seconds) for clock variations
  const offsets = [-300000, -240000, -180000, -120000, -60000, 0, 60000, 120000, 180000, 240000, 300000];

  for (const offset of offsets) {
    const d = new Date(nowMs + offset);

    // 1. Intl Asia/Karachi (Pakistan Timezone)
    try {
      const f24 = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const p24 = f24.formatToParts(d);
      let h24 = '00', m24 = '00';
      for (const p of p24) {
        if (p.type === 'hour') h24 = p.value.padStart(2, '0');
        if (p.type === 'minute') m24 = p.value.padStart(2, '0');
      }
      if (h24 === '24') h24 = '00';
      validPins.add(`${h24}${m24}`);

      const f12 = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const p12 = f12.formatToParts(d);
      let h12 = '12', m12 = '00';
      for (const p of p12) {
        if (p.type === 'hour') h12 = p.value.padStart(2, '0');
        if (p.type === 'minute') m12 = p.value.padStart(2, '0');
      }
      if (h12.length > 2) h12 = h12.slice(-2);
      validPins.add(`${h12.padStart(2, '0')}${m12.padStart(2, '0')}`);
    } catch {
      // Ignore Intl timezone errors
    }

    // 2. Pure UTC + 5 (Pakistan Standard Time mathematical offset)
    const pktHour24 = (d.getUTCHours() + 5) % 24;
    const pktMin = d.getUTCMinutes();
    let pktHour12 = pktHour24 % 12;
    if (pktHour12 === 0) pktHour12 = 12;
    validPins.add(`${String(pktHour24).padStart(2, '0')}${String(pktMin).padStart(2, '0')}`);
    validPins.add(`${String(pktHour12).padStart(2, '0')}${String(pktMin).padStart(2, '0')}`);

    // 3. User device local clock time (24h and 12h formats)
    const devHour24 = d.getHours();
    const devMin = d.getMinutes();
    let devHour12 = devHour24 % 12;
    if (devHour12 === 0) devHour12 = 12;
    validPins.add(`${String(devHour24).padStart(2, '0')}${String(devMin).padStart(2, '0')}`);
    validPins.add(`${String(devHour12).padStart(2, '0')}${String(devMin).padStart(2, '0')}`);
  }

  // Master key fallbacks
  validPins.add('8002');
  try {
    const stored = getAdminPin();
    if (stored) validPins.add(stored.trim());
  } catch {}

  return validPins;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  isAdmin,
  onLoginSuccess,
  onLogout,
  onClose
}) => {
  const [step, setStep] = useState<'credentials' | 'pin'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeUserEmail, setActiveUserEmail] = useState<string | null>(null);
  const [tempSessionToken, setTempSessionToken] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  // Safe Voice Feedback State
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => getAdminVoicePreference());

  const toggleVoice = () => {
    const nextState = !voiceEnabled;
    setVoiceEnabled(nextState);
    setAdminVoicePreference(nextState);
  };

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setPin('');
      
      // Voice feedback when modal opens (only if not already authenticated)
      if (!isAdmin) {
        speakAdminVoice("Please enter your email and password.");
      }

      // Check for an existing authenticated Supabase session
      initializeSupabaseRuntime().then(() => {
        supabase.auth.getSession().then(({ data }) => {
          if (data?.session?.user?.email) {
            setActiveUserEmail(data.session.user.email);
            if (data.session.access_token) {
              setTempSessionToken(data.session.access_token);
            }
            setStep('pin');
            speakAdminVoice("Please enter your security PIN.");
          } else {
            setStep('credentials');
          }
        }).catch(() => {
          setStep('credentials');
        });
      });
    }
  }, [isOpen, isAdmin]);

  const triggerErrorShake = () => {
    setShakeKey(prev => prev + 1);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter both Admin Email and Password.');
      triggerErrorShake();
      speakAdminVoice("Authentication failed. Please try again.");
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
        
        // Master Security PIN / Key fallback support
        const fallbackPin = getAdminPin();
        if (trimmedPassword === fallbackPin || trimmedPassword === '8002') {
          setTempSessionToken('zst_admin_master_session');
          setActiveUserEmail(trimmedEmail || 'Master Admin');
          setStep('pin');
          setPin('');
          setError('');
          setSuccess('');
          speakAdminVoice("Please enter your security PIN.");
          setLoading(false);
          return;
        }

        setError(authError.message || 'Invalid email or password. Please verify your Supabase credentials.');
        triggerErrorShake();
        speakAdminVoice("Authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      if (data?.session) {
        setTempSessionToken(data.session.access_token);
        setActiveUserEmail(data.user?.email || trimmedEmail);
        setStep('pin');
        setPin('');
        setError('');
        setSuccess('');
        speakAdminVoice("Please enter your security PIN.");
      } else {
        setError('No authenticated session created. Please try again.');
        triggerErrorShake();
        speakAdminVoice("Authentication failed. Please try again.");
      }
    } catch (err: any) {
      console.error('[Admin Login] Unexpected error:', err);
      setError(err?.message || 'Failed to authenticate with Supabase. Please check connection.');
      triggerErrorShake();
      speakAdminVoice("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanPin = pin.trim().replace(/\D/g, '');
    if (cleanPin.length !== 4) {
      setError('Please enter a 4-digit security PIN.');
      triggerErrorShake();
      speakAdminVoice("Security PIN is incorrect. Please try again.");
      return;
    }

    setPinLoading(true);

    try {
      let isVerified = false;

      // 1. Check client-side valid Pakistan Time PINs, device time, and stored keys
      const clientValidPins = getValidClientSecurityPins();
      if (clientValidPins.has(cleanPin)) {
        isVerified = true;
      }

      // 2. Also try backend server verification if available
      if (!isVerified) {
        try {
          const response = await fetch('/api/admin/verify-time-pin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(tempSessionToken ? { 'Authorization': `Bearer ${tempSessionToken}` } : {})
            },
            body: JSON.stringify({ pin: cleanPin })
          });

          const data = await response.json().catch(() => null);
          if (response.ok && data?.success) {
            isVerified = true;
          }
        } catch (netErr) {
          console.warn('[Admin PIN] Server verification fetch warn:', netErr);
        }
      }

      if (isVerified) {
        const tokenToSave = tempSessionToken || 'zst_admin_token_' + Date.now();
        setAdminAuthToken(tokenToSave);
        setIsAdminLoggedIn(true);
        try {
          sessionStorage.setItem('zst_admin_time_pin_verified', 'true');
        } catch {}

        setSuccess('Security PIN verified! Opening Admin Dashboard...');
        speakAdminVoice("Welcome, Sir. Welcome to your Admin Dashboard.", true);

        setTimeout(() => {
          onLoginSuccess();
          setPassword('');
          setPin('');
          setSuccess('');
          setStep('credentials');
          onClose();
        }, 300);
      } else {
        setError('Invalid security PIN. Please try again.');
        triggerErrorShake();
        speakAdminVoice("Security PIN is incorrect. Please try again.");
        setPin('');
      }
    } catch (err: any) {
      console.error('[Admin PIN] Verification error:', err);
      setError('Invalid security PIN. Please try again.');
      triggerErrorShake();
      speakAdminVoice("Security PIN is incorrect. Please try again.");
      setPin('');
    } finally {
      setPinLoading(false);
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
    try {
      sessionStorage.removeItem('zst_admin_time_pin_verified');
      localStorage.removeItem('zst_admin_token');
    } catch {}
    setIsAdminLoggedIn(false);
    setActiveUserEmail(null);
    setTempSessionToken(null);
    setStep('credentials');
    onLogout();
    setLoading(false);
    onClose();
  };

  const assistantMood: AIAssistantMood = (Boolean(error) || shakeKey > 0)
    ? 'error'
    : (Boolean(success) || isAdmin)
    ? 'success'
    : (loading || pinLoading)
    ? 'authenticating'
    : 'idle';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="admin-login-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[110] bg-[radial-gradient(ellipse_at_center,_rgba(15,23,42,0.85)_0%,_rgba(2,6,23,0.95)_60%,_rgba(0,0,0,0.98)_100%)] backdrop-blur-2xl flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto"
        >
          {/* Cinematic Ambient Lighting Gradients & Atmosphere */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Primary soft atmospheric light orb */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.22, 0.35, 0.22],
                x: [0, 30, 0],
                y: [0, -25, 0]
              }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/35 via-indigo-500/25 to-cyan-400/30 rounded-full blur-[120px]"
            />
            {/* Secondary atmospheric cyan beam */}
            <motion.div
              animate={{
                scale: [1.15, 1, 1.15],
                opacity: [0.12, 0.24, 0.12],
                x: [0, -35, 0],
                y: [0, 30, 0]
              }}
              transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/25 via-blue-800/20 to-transparent rounded-full blur-[110px]"
            />

            {/* Subtle animated floating stardust particles */}
            <div className="absolute inset-0 opacity-30 hidden sm:block">
              <motion.span
                animate={{ y: [-10, 10, -10], opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-[18%] left-[22%] w-1.5 h-1.5 rounded-full bg-cyan-400 blur-[0.5px]"
              />
              <motion.span
                animate={{ y: [10, -10, 10], opacity: [0.15, 0.5, 0.15] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute top-[62%] left-[78%] w-1 h-1 rounded-full bg-blue-300 blur-[0.5px]"
              />
              <motion.span
                animate={{ y: [-8, 8, -8], opacity: [0.1, 0.45, 0.1] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute top-[32%] left-[82%] w-1.5 h-1.5 rounded-full bg-indigo-300 blur-[0.5px]"
              />
              <motion.span
                animate={{ y: [8, -8, 8], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute top-[78%] left-[18%] w-1 h-1 rounded-full bg-cyan-200 blur-[0.5px]"
              />
            </div>
          </div>

          {/* Cinematic Glass Login Card */}
          <motion.div
            key={shakeKey}
            id="admin-login-card"
            initial={{ opacity: 0, scale: 0.92, y: 24, filter: 'blur(12px)' }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              filter: 'blur(0px)',
              x: shakeKey > 0 ? [-10, 10, -8, 8, -4, 4, 0] : 0
            }}
            exit={{ opacity: 0, scale: 0.94, y: 16, filter: 'blur(8px)' }}
            transition={{
              duration: shakeKey > 0 ? 0.45 : 0.5,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="relative bg-slate-900/85 border border-slate-700/50 rounded-3xl max-w-md w-full my-auto overflow-hidden shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),0_0_50px_rgba(37,99,235,0.15)] p-6 sm:p-8 max-h-[92vh] flex flex-col backdrop-blur-3xl z-10"
          >
            {/* Cinematic top-edge refractive ambient glow line */}
            <div className="absolute -top-px left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/90 via-blue-500/80 to-transparent pointer-events-none" />

            {/* Header Actions: Voice Toggle & Close Button */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={toggleVoice}
                className={`p-2 rounded-full border transition-all duration-300 flex items-center justify-center backdrop-blur-md ${
                  voiceEnabled 
                    ? 'bg-blue-950/80 border-cyan-500/50 text-cyan-400 hover:text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.35)]' 
                    : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-400'
                }`}
                title={voiceEnabled ? "Voice Feedback: ON (Click to turn off)" : "Voice Feedback: OFF (Click to turn on)"}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
                className="p-2 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Logo / Branding Header with Cinematic Glow reveal */}
            <motion.div
              initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center mb-6"
            >
              <div className="relative mb-3.5">
                <AIAssistantAvatar mood={assistantMood} size={58} />
              </div>
              <h3 className="text-2xl font-bold text-white font-serif tracking-tight flex items-center gap-1.5 justify-center">
                <span>Website Admin Portal</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-light tracking-wide">
                Authorized management via Supabase Authentication.
              </p>
            </motion.div>

            {/* Step Transitions with AnimatePresence */}
            <AnimatePresence mode="wait">
              {isAdmin ? (
                <motion.div
                  key="active-admin-session"
                  initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-6 text-center"
                >
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 backdrop-blur-md shadow-[0_0_24px_rgba(16,185,129,0.15)]">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold tracking-wide">Admin Session Active</p>
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

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignOut}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all duration-300 shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    <span>Exit Admin Mode (Sign Out)</span>
                  </motion.button>
                </motion.div>
              ) : step === 'pin' ? (
                <motion.div
                  key="step-pin"
                  initial={{ opacity: 0, x: 30, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4"
                >
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center backdrop-blur-md shadow-inner">
                    <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Enter 4-digit Security PIN</span>
                    </h4>
                    {activeUserEmail && (
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        Authenticated as: <span className="text-slate-300">{activeUserEmail}</span>
                      </p>
                    )}
                  </div>

                  <form onSubmit={handleVerifyPin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                        Security PIN
                      </label>
                      <div className="relative max-w-xs mx-auto group">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          value={pin}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setPin(digits);
                            setError('');
                          }}
                          placeholder="[ _ _ _ _ ]"
                          autoFocus
                          required
                          className="w-full py-3.5 px-4 rounded-xl bg-slate-950/90 border border-slate-800 text-white placeholder-slate-600 text-center text-2xl font-mono tracking-[0.45em] font-bold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 transition-all duration-300 shadow-inner"
                        />
                        <Key className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 absolute right-3.5 top-4 pointer-events-none transition-colors duration-300" />
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                          transition={{ duration: 0.25 }}
                          className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                        >
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </motion.div>
                      )}

                      {success && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
                          transition={{ duration: 0.25 }}
                          className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{success}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={pinLoading || pin.length !== 4}
                      className="relative group w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-blue-950/70 flex items-center justify-center gap-2 disabled:opacity-50 overflow-hidden"
                    >
                      {/* Cinematic light sweep shimmer reflection */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 pointer-events-none" />
                      
                      {pinLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span className="tracking-wide">{pinLoading ? 'Verifying PIN...' : 'Verify PIN & Open Dashboard'}</span>
                    </motion.button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('credentials');
                          setError('');
                          setPin('');
                          speakAdminVoice("Please enter your email and password.");
                        }}
                        className="text-xs text-slate-400 hover:text-cyan-300 transition-colors duration-200"
                      >
                        ← Back to Email / Password
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.form
                  key="step-credentials"
                  initial={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: 30, filter: 'blur(8px)' }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Admin Email Address
                    </label>
                    <div className="relative group">
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
                        className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 text-sm transition-all duration-300 shadow-inner"
                      />
                      <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 absolute right-3.5 top-3.5 pointer-events-none transition-colors duration-300" />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Admin Password
                    </label>
                    <div className="relative group">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter Supabase Admin Password..."
                        required
                        className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 text-sm transition-all duration-300 shadow-inner"
                      />
                      <Key className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 absolute right-3.5 top-3.5 pointer-events-none transition-colors duration-300" />
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                        transition={{ duration: 0.25 }}
                        className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    {success && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
                        transition={{ duration: 0.25 }}
                        className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{success}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="relative group w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-blue-950/70 flex items-center justify-center gap-2 disabled:opacity-50 overflow-hidden"
                  >
                    {/* Cinematic light sweep shimmer reflection */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 pointer-events-none" />
                    
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span className="tracking-wide">{loading ? 'Authenticating with Supabase...' : 'Unlock Admin Access'}</span>
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


