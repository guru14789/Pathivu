import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const resetSchema = z.object({
  email: z.string().email('Please enter a valid hospital email address'),
});

type ResetFormValues = z.infer<typeof resetSchema>;

const ResetPasswordPage = () => {
  const [isPending, setIsPending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormValues) => {
    setIsPending(true);
    setError(null);
    try {
      await axios.post('/api/auth/forgot-password', data);
      setIsSent(true);
    } catch (err: any) {
      setError('If an account exists with this email, a reset link will be sent.');
      setIsSent(true); // Don't expose existence of email
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] px-6 relative z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-8">
          
          <div className="text-center space-y-4">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 rounded-2xl mb-2">
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Reset Password</h1>
              <p className="text-slate-400 text-sm mt-2">
                Enter your hospital email and we'll send you a link to reset your password.
              </p>
            </div>
          </div>

          {isSent ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg">Email Sent!</h3>
                <p className="text-slate-400 text-sm mt-2">
                  Check your inbox for further instructions. If you don't see it, check your spam folder.
                </p>
              </div>
              <Link 
                to="/login"
                className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all"
              >
                Return to Login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-300 ml-1">Hospital Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@bewell.in"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-600"
                />
                {errors.email && (
                  <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending link...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          )}

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              If you've forgotten your email address, <br />
              please contact your hospital IT department.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
