import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useExperiment } from '../context/ExperimentContext.tsx';
import { FlaskConical, Shield, UserCheck, Settings } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { participantUuid, groupType } = useExperiment();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/sandbox');

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-slate-900 group">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-slate-800 transition-colors">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
              IMT Research Lab
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Witte et al. (2025)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-none">
              Information Manipulation Theory in Online Retailing
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {participantUuid && !isAdminRoute && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ID: {participantUuid.slice(0, 8)}...</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Link
              to="/sandbox"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                location.pathname === '/sandbox'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Test Conditions
            </Link>

            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                isAdminRoute
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span>Admin & Data</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
