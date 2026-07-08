import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import api from '../services/api.js';
import { Building, Mail, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginFormInputs) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', data);
      if (response.data?.success) {
        const { token, user } = response.data;
        login(token, user);
        showToast('Welcome back! Login successful.', 'success');
        navigate('/dashboard');
      } else {
        showToast(response.data?.message || 'Login failed. Please check credentials.', 'error');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = error.response?.data?.message || 'Server error. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
      {/* Decorative gradient glowing circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />

      {/* Main card */}
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10 animate-slide-in">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-650 flex items-center justify-center text-white border border-indigo-500/30 shadow-lg shadow-indigo-650/20">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 leading-tight">Society Management</h1>
            <p className="text-sm text-slate-400 mt-1">Sign in to manage your tenant portal</p>
          </div>
        </div>

        {/* Demo Credentials Info Box */}
        <div className="mb-6 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/10 text-xs text-indigo-300">
          <div className="flex gap-2 font-semibold mb-1 text-indigo-200">
            <ShieldAlert size={14} className="mt-0.5" />
            <span>Demo credentials (password: Password123)</span>
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
            <li>Admin: <code className="text-slate-200">admin@greenwood.com</code></li>
            <li>Team Lead: <code className="text-slate-200">lead@greenwood.com</code></li>
            <li>Member: <code className="text-slate-200">member@greenwood.com</code></li>
          </ul>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={16} />
              </span>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border ${
                  errors.email ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20'
                } rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-medium text-rose-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                disabled={isSubmitting}
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-900 border ${
                  errors.password ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20'
                } rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-rose-400">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
