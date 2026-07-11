import React from 'react';
import { ShieldAlert, Terminal, Copy, Check } from 'lucide-react';

const SetupAssistant: React.FC = () => {
  const [copiedClient, setCopiedClient] = React.useState(false);
  const [copiedServer, setCopiedServer] = React.useState(false);

  const clientCode = `VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here\nVITE_API_URL=http://localhost:5000/api/v1`;
  const serverCode = `CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here\nCLERK_SECRET_KEY=your_clerk_secret_key_here\nCLERK_JWT_KEY=your_optional_jwt_verification_pem_key_here`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 relative overflow-hidden px-4 py-12 font-sans">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-650/10 rounded-full blur-3xl" />

      {/* Main card */}
      <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 sm:p-10 rounded-2xl shadow-2xl relative z-10 animate-slide-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldAlert className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 leading-tight">Clerk Configuration Required</h1>
            <p className="text-sm text-slate-400 mt-1">Complete these steps to run the Society Management Portal</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <h2 className="text-sm font-semibold text-indigo-400 mb-2">1. Get your Clerk API keys</h2>
            <p className="text-xs text-slate-450 leading-relaxed font-medium">
              Sign in to your{' '}
              <a
                href="https://dashboard.clerk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline font-semibold"
              >
                Clerk Dashboard
              </a>
              , create or select your application, and copy your keys from the <strong>API Keys</strong> page.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-indigo-400">2. Configure Client environment</h2>
              <button
                onClick={() => copyToClipboard(clientCode, setCopiedClient)}
                className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer border-0 bg-transparent font-medium"
              >
                {copiedClient ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
                <span>{copiedClient ? 'Copied!' : 'Copy Template'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-2.5">
              Add this block to your <code>client/.env</code> file:
            </p>
            <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded-lg text-indigo-300 border border-slate-900 overflow-x-auto whitespace-pre select-all">
              {clientCode}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-indigo-400">3. Configure Server environment</h2>
              <button
                onClick={() => copyToClipboard(serverCode, setCopiedServer)}
                className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer border-0 bg-transparent font-medium"
              >
                {copiedServer ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
                <span>{copiedServer ? 'Copied!' : 'Copy Template'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-2.5">
              Add this block to your <code>server/.env</code> file:
            </p>
            <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded-lg text-indigo-300 border border-slate-900 overflow-x-auto whitespace-pre select-all">
              {serverCode}
            </pre>
          </div>

          <div className="flex gap-3 items-center p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/10 text-xs text-indigo-300">
            <Terminal size={16} className="shrink-0" />
            <p>
              Once your environment variables are configured, save the files and restart your dev servers to apply changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupAssistant;
