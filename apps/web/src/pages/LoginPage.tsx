import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: {
      email: 'admin@bewell.in',
      password: 'password123',
      rememberMe: true,
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsPending(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', data);
      login(response.data);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Invalid credentials or account deactivated. Please contact your system administrator.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] overflow-hidden relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #6A1B9A 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[400px] px-4 relative z-10"
      >
        <div className="bg-white rounded-2xl border border-gray-200 shadow-premium p-8">
          <div className="space-y-6">
            {/* Brand */}
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#6A1B9A] shadow-sm mb-1"
              >
                <span className="text-lg font-bold text-white">BA</span>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  BeWell <span className="text-[#6A1B9A] font-light">AssetIQ</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Hospital Chain Asset Management
                </p>
              </div>
            </div>

            {/* Quick Access */}
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 space-y-2">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-center">
                Quick Access
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'admin@bewell.in');
                    setValue('password', 'password123');
                  }}
                  className="bg-[#6A1B9A]/8 hover:bg-[#6A1B9A]/15 border border-[#6A1B9A]/20 hover:border-[#6A1B9A]/30 text-[#6A1B9A] text-xs py-2 px-3 rounded-lg transition-all font-semibold"
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'chn_admin@bewell.com');
                    setValue('password', 'password123');
                  }}
                  className="bg-[#5BC0DE]/8 hover:bg-[#5BC0DE]/15 border border-[#5BC0DE]/20 hover:border-[#5BC0DE]/30 text-[#3A9BBF] text-xs py-2 px-3 rounded-lg transition-all font-semibold"
                >
                  Branch Admin
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 ml-0.5">Hospital Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@bewell.in"
                  className={cn(
                    "w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#6A1B9A]/40 focus:ring-1 focus:ring-[#6A1B9A]/10 transition-all text-sm placeholder:text-gray-400",
                    errors.email && "border-red-300 focus:border-[#E53935]/40 focus:ring-[#E53935]/10"
                  )}
                />
                {errors.email && (
                  <p className="text-xs text-[#E53935] ml-0.5 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-0.5">
                  <label className="text-xs font-semibold text-gray-700">Password</label>
                  <Link to="/reset-password" className="text-[11px] font-semibold text-[#6A1B9A] hover:text-[#7B1FA2] transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={cn(
                      "w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#6A1B9A]/40 focus:ring-1 focus:ring-[#6A1B9A]/10 transition-all text-sm placeholder:text-gray-400",
                      errors.password && "border-red-300 focus:border-[#E53935]/40 focus:ring-[#E53935]/10"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-[#E53935] ml-0.5 font-medium">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  id="rememberMe"
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#6A1B9A] focus:ring-[#6A1B9A]/30 transition-all cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-xs text-gray-500 cursor-pointer select-none font-medium">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#6A1B9A] hover:bg-[#7B1FA2] disabled:bg-[#6A1B9A]/50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Secure Login</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-[10px] text-gray-400 text-center font-medium leading-relaxed">
              Unauthorized access is strictly prohibited.
              All login attempts are monitored and logged.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
