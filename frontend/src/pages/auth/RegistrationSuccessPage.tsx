import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const RegistrationSuccessPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div>
          <h1 className="text-xl font-bold text-slate-900">Registration Successful!</h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Your ColdChain-RL operator account has been created.
            In compliance with strict security protocol, you must now explicitly sign in to initiate your session.
          </p>
        </div>

        <Link
          to="/login"
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all"
        >
          <span>Proceed to Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
