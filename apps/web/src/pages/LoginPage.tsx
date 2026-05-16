import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid hospital email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsPending(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', data);
      login(response.data);
      navigate('/dashboard');
    } catch (err: any) {
      // Never expose which field is wrong
      setError('Invalid credentials or account deactivated. Please contact your system administrator.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[440px] px-6 relative z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-8">
          
          {/* Brand Header */}
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-2xl shadow-inner mb-2"
            >
              <img src="/logo.png" alt="BeWell Logo" className="w-14 h-14 object-contain" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                BeWell <span className="text-blue-500 font-extralight tracking-widest text-xl uppercase">AssetIQ</span>
              </h1>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-tighter mt-1">
                Hospital Chain Asset Management
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200 leading-tight">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300 ml-1">Hospital Email</label>
              <div className="relative group">
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@bewell.in"
                  className={cn(
                    "w-full bg-slate-950/50 border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-600",
                    errors.email && "border-red-500/50 focus:ring-red-500/20 focus:border-red-500"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-slate-300">Password</label>
                <Link 
                  to="/reset-password" 
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn(
                    "w-full bg-slate-950/50 border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200 placeholder:text-slate-600",
                    errors.password && "border-red-500/50 focus:ring-red-500/20 focus:border-red-500"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2 ml-1">
              <div className="relative flex items-center">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  id="rememberMe"
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500/40 focus:ring-offset-slate-900 transition-all cursor-pointer"
                />
              </div>
              <label htmlFor="rememberMe" className="text-sm text-slate-400 cursor-pointer select-none">
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Secure Login</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              Unauthorized access is strictly prohibited. <br />
              All login attempts are monitored and logged.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
