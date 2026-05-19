import { useState } from 'react';
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
  const [_error, setError] = useState<string | null>(null);

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
      await axios.post('/api/auth/reset-password', data);
      setIsSent(true);
    } catch (err: any) {
      setError('If an account exists with this email, a reset link will be sent.');
      setIsSent(true);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/5 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] px-6 relative z-10"
      >
        <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-premium space-y-8">
          
          <div className="text-center space-y-4">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-2">
              <Mail className="w-8 h-8 text-[#6A1B9A]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
              <p className="text-gray-500 text-sm mt-2">
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
              <div className="bg-green-50 border border-green-200 p-6 rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-gray-900 font-bold text-lg">Email Sent!</h3>
                <p className="text-gray-500 text-sm mt-2">
                  Check your inbox for further instructions. If you don't see it, check your spam folder.
                </p>
              </div>
              <Link 
                to="/login"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-all"
              >
                Return to Login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Hospital Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@bewell.in"
                  className="w-full bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A] transition-all placeholder:text-gray-400"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#6A1B9A] hover:bg-[#7B1FA2] disabled:bg-purple-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
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
            <p className="text-xs text-gray-400 leading-relaxed">
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
