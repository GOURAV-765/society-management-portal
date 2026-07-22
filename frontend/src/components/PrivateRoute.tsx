import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Building, RefreshCw, Wifi, Server, CheckCircle, Loader2 } from 'lucide-react';

const SLOW_THRESHOLD_MS = 5000;

// Detect if this looks like a post-signup redirect (Clerk sets a query param or
// the user just came from /signup in sessionStorage)
function isNewUserFlow(): boolean {
  // Clerk appends ?__clerk_status=... on redirects
  const params = new URLSearchParams(window.location.search);
  const clerkStatus = params.get('__clerk_status');
  const fromSignup = sessionStorage.getItem('smp_from_signup');
  return clerkStatus === 'signed_up' || !!fromSignup;
}

const steps = [
  { id: 'auth',    label: 'Verifying your identity',       done: false },
  { id: 'account', label: 'Setting up your account',        done: false },
  { id: 'profile', label: 'Loading your portal profile',    done: false },
];

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, isLoading, loadingStage, profileError, retrySync } = useAuth();
  const [isSlowLoad, setIsSlowLoad]     = useState(false);
  const [elapsed, setElapsed]           = useState(0);
  const [isRetrying, setIsRetrying]     = useState(false);
  const [newUser, setNewUser]           = useState(false);
  const [stepIndex, setStepIndex]       = useState(0);   // which onboarding step is "active"

  // Detect new-user flow once on mount
  useEffect(() => {
    if (isNewUserFlow()) {
      setNewUser(true);
      sessionStorage.setItem('smp_from_signup', '1');
    }
  }, []);

  // Clear flag once fully authenticated
  useEffect(() => {
    if (isAuthenticated) sessionStorage.removeItem('smp_from_signup');
  }, [isAuthenticated]);

  // Advance onboarding steps every ~2 s while loading (cosmetic progress)
  useEffect(() => {
    if (!isLoading || !newUser) return;
    if (stepIndex >= steps.length - 1) return;
    const t = setTimeout(() => setStepIndex(i => Math.min(i + 1, steps.length - 1)), 2200);
    return () => clearTimeout(t);
  }, [isLoading, newUser, stepIndex]);

  // Track elapsed time and show slow-load hint
  useEffect(() => {
    if (!isLoading) { setIsSlowLoad(false); setElapsed(0); return; }
    const slowTimer = setTimeout(() => setIsSlowLoad(true), SLOW_THRESHOLD_MS);
    const ticker    = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => { clearTimeout(slowTimer); clearInterval(ticker); };
  }, [isLoading]);

  const handleRetry = () => {
    setIsRetrying(true);
    setIsSlowLoad(false);
    setElapsed(0);
    setStepIndex(0);
    retrySync();
    setTimeout(() => setIsRetrying(false), 1000);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    // ── NEW USER: Onboarding step-through screen ──────────────────────────
    if (newUser) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
          {/* Ambient blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/8 rounded-full blur-[130px]" />
            <div className="absolute top-1/3 left-2/3 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[90px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full text-center">
            {/* Logo with pulse ring */}
            <div className="relative flex items-center justify-center">
              <div className="absolute h-24 w-24 rounded-full border border-indigo-500/20 animate-ping opacity-30" />
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.4)] border border-indigo-500/30">
                <Building className="h-10 w-10 text-white" />
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-slate-400">
                Welcome aboard! 🎉
              </h1>
              <p className="text-sm text-slate-400">We're setting up your Society Portal account…</p>
            </div>

            {/* Step list */}
            <div className="w-full space-y-3">
              {steps.map((step, i) => {
                const isDone    = i < stepIndex;
                const isActive  = i === stepIndex;
                const isPending = i > stepIndex;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                      isDone    ? 'border-emerald-500/30 bg-emerald-500/8'
                    : isActive  ? 'border-indigo-500/40 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                    : 'border-slate-800/60 bg-slate-900/30 opacity-40'
                    }`}
                  >
                    <div className="shrink-0">
                      {isDone ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : isActive ? (
                        <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-700" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      isDone ? 'text-emerald-300' : isActive ? 'text-slate-100' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Slow-load banner */}
            {isSlowLoad && (
              <div className="w-full rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-left space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-400">
                  <Server className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Server waking up</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The backend is on a free tier and may take <span className="text-amber-300 font-medium">30–60 seconds</span> to start. Almost there…
                </p>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((elapsed / 35) * 100, 95)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── RETURNING USER: minimal spinner ──────────────────────────────────
    const stageLabel = loadingStage === 'clerk' ? 'Initializing authentication…' : 'Connecting to server…';
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-7 max-w-sm w-full text-center">
          {/* Logo */}
          <div className="h-[72px] w-[72px] rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.35)] border border-indigo-500/30">
            <Building className="h-9 w-9 text-white" />
          </div>

          {/* Dual-ring spinner */}
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-14 rounded-full border-[3px] border-slate-800" />
            <div className="absolute h-14 w-14 rounded-full border-[3px] border-transparent border-t-indigo-500 animate-spin" />
            <div
              className="absolute h-8 w-8 rounded-full border-[2px] border-transparent border-t-purple-400 animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
            />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200 tracking-wide">{stageLabel}</p>
            {elapsed > 0 && <p className="text-xs text-slate-500 tabular-nums">{elapsed}s elapsed</p>}
          </div>

          {isSlowLoad && (
            <div className="w-full rounded-xl border border-amber-500/25 bg-amber-500/8 backdrop-blur px-5 py-4 text-left space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-amber-400">
                <Server className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider">Server waking up</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The backend is hosted on a free tier and may take up to{' '}
                <span className="text-amber-300 font-medium">30–60 seconds</span> to respond after inactivity. Please hold on…
              </p>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((elapsed / 35) * 100, 97)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Backend error + retry ─────────────────────────────────────────────────
  if (!isAuthenticated && profileError) {
    const isTimeout = profileError.toLowerCase().includes('taking too long') ||
      profileError.toLowerCase().includes('timeout');

    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/6 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-sm space-y-5 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
            {isTimeout
              ? <Wifi className="h-7 w-7 text-rose-400" />
              : <Server className="h-7 w-7 text-rose-400" />}
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-100">
              {isTimeout ? 'Server is starting up' : 'Could not connect'}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">{profileError}</p>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-sm font-semibold text-white transition-all duration-200 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying…' : 'Retry Connection'}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-5 rounded-xl border border-slate-700 hover:border-slate-500 text-sm font-medium text-slate-400 hover:text-slate-200 transition-all duration-200 cursor-pointer"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Route guard ───────────────────────────────────────────────────────────
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
