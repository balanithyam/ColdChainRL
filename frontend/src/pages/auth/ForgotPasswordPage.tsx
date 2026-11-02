import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Mail, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { authService } from '../../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setMsg(res.data.message);
      if (res.data.reset_token) {
        setToken(res.data.reset_token);
      }
    } catch (e) {
      setMsg('If the email exists, a password reset token has been dispatched.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Reset Password</h1>
            <p className="text-xs text-slate-500">Provide account email to receive reset token</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@coldchain.ai"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Request Reset Token</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {msg && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 space-y-2">
            <p className="font-semibold">{msg}</p>
            {token && (
              <div className="pt-2 border-t border-indigo-200">
                <p className="text-[11px] text-slate-600">Simulated Security Token:</p>
                <code className="block p-1.5 bg-white rounded border border-indigo-200 text-[10px] break-all font-mono">
                  {token}
                </code>
                <Link
                  to={`/reset-password?token=${token}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                >
                  Click here to set new password ?
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
