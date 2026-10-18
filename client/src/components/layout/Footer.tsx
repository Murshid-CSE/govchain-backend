import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span>GovChain Platform</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              {t.tagline}. Designed to bring civic transparency, verifiable audit trails, and accountable public works management to citizens and departments.
            </p>
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t.auditNotice}</span>
            </div>
          </div>

          {/* Civic Services */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3 uppercase tracking-wider text-[11px]">
              Civic Services
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/issues" className="hover:text-white transition">
                  {t.navIssues}
                </Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-white transition">
                  {t.navReport}
                </Link>
              </li>
              <li>
                <Link to="/chat" className="hover:text-white transition">
                  {t.navChat}
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition">
                  {t.navTrack}
                </Link>
              </li>
            </ul>
          </div>

          {/* Transparency & Audit */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3 uppercase tracking-wider text-[11px]">
              Transparency
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/transparency?tab=tenders" className="hover:text-white transition">
                  Public Tenders & Contracts
                </Link>
              </li>
              <li>
                <Link to="/transparency?tab=budgets" className="hover:text-white transition">
                  Departmental Budgets
                </Link>
              </li>
              <li>
                <Link to="/transparency?tab=polls" className="hover:text-white transition">
                  Community Sentiment Polls
                </Link>
              </li>
              <li>
                <Link to="/transparency?tab=audit" className="hover:text-white transition">
                  Cryptographic Audit Verification
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Civic Disclaimer & Legal */}
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-center md:text-left text-[11px] max-w-2xl">
            {t.civicDisclaimer}
          </p>
          <p className="text-slate-400 text-[11px]">
            © {new Date().getFullYear()} GovChain. Open-source civic transparency initiative.
          </p>
        </div>
      </div>
    </footer>
  );
};
