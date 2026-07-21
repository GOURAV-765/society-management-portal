import React, { useState } from 'react';
import { Award, Download, Loader2 } from 'lucide-react';

const CertificateGenerator: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    eventName: '',
    date: '',
    issueId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/v1/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate certificate');
      }

      // Handle the PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${formData.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading certificate:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Certificate Generator</h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate and download participation or appreciation certificates.
          </p>
        </div>
        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
          <Award className="h-6 w-6 text-indigo-400" />
        </div>
      </div>

      <div className="glass-panel p-6">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                Recipient Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label htmlFor="eventName" className="block text-sm font-medium text-slate-300 mb-1.5">
                Event / Course Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="e.g. Annual Hackathon 2026"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Issue Date (Optional)
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="issueId" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Certificate ID (Optional)
                </label>
                <input
                  type="text"
                  id="issueId"
                  name="issueId"
                  value={formData.issueId}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="e.g. CERT-12345"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Generate & Download Certificate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CertificateGenerator;
