import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Cpu, AlertCircle, ArrowRight, Lock, Mail, Zap, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.search.includes('expired=1')) {
      setSessionExpiredNotice(true);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.login({ email, password });
      login(res.data.access_token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('operator@coldchain.ai');
    setPassword('Password123!');
    setError('');
    setLoading(true);

    try {
      const res = await authService.login({
        email: 'operator@coldchain.ai',
        password: 'Password123!'
      });
      login(res.data.access_token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError('Unable to authenticate with demo credentials. Verify backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">ColdChain-RL Control Room</h1>
            <p className="text-xs text-indigo-300">Sign In to Authenticated Session</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {sessionExpiredNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Session expired or reconnected. Please sign in to resume telemetry.</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Sign-In Card */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full p-3 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-950 block">Quick Demo Operator Sign-In</span>
                <span className="text-[11px] text-indigo-600 block">operator@coldchain.ai</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              1-Click
            </span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-2 text-[11px] text-slate-400 uppercase tracking-wider font-semibold absolute">
              or enter credentials
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@organization.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-indigo-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to System</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-600 pt-2">
            Don't have an operator account?{' '}
            <Link to="/register" className="text-indigo-600 font-bold hover:underline">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
