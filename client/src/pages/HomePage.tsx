import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../api/client';
import type { Issue } from '../types';
import { CivicMap } from '../components/map/CivicMap';
import { StatusBadge, CategoryLabel } from '../components/common/Badge';
import { LoadingSpinner, ErrorBanner } from '../components/common/UIFeedback';
import {
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Search,
  Sparkles,
  Lock,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalIssues: 0,
    resolvedIssues: 0,
    departmentsCount: 0,
    auditValid: true,
  });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch recent issues
        const issuesRes = await api.get<{ issues: Issue[] }>('/issues?limit=6');
        const fetchedIssues = issuesRes.data?.issues || [];
        setIssues(fetchedIssues);

        // Fetch departments
        const deptsRes = await api.get<{ departments: unknown[] }>('/departments');
        const deptsCount = deptsRes.data?.departments?.length || 0;

        // Fetch audit status
        const auditRes = await api.get<{ valid: boolean; totalEvents: number }>('/audit/verify');

        setStats({
          totalIssues: issuesRes.meta?.total || fetchedIssues.length,
          resolvedIssues: fetchedIssues.filter((i) => i.status === 'resolved').length,
          departmentsCount: deptsCount,
          auditValid: auditRes.data?.valid ?? true,
        });
      } catch (err: any) {
        setError(err.message || 'Unable to connect to live GovChain services.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>AI-Assisted Citizen Reporting & Cryptographic Audit Ledger</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            {t.heroTitle}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {t.heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/report"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm shadow-md transition transform active:scale-95"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {t.btnReportNow}
            </Link>
            <Link
              to="/chat"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition backdrop-blur-sm"
            >
              <MessageSquare className="w-4 h-4 mr-2 text-blue-300" />
              {t.btnAiIntake}
            </Link>
            <Link
              to="/issues"
              className="inline-flex items-center px-5 py-3 rounded-xl text-slate-300 hover:text-white font-medium text-sm transition"
            >
              <Search className="w-4 h-4 mr-1.5" />
              {t.btnExploreMap}
            </Link>
          </div>
        </div>
      </section>

      {/* Live Statistics Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="civic-card-3d p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Public Issues</span>
              <AlertCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : stats.totalIssues}
            </div>
            <span className="text-xs text-slate-500">Documented on platform</span>
          </div>

          <div className="civic-card-3d p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Departments</span>
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : stats.departmentsCount}
            </div>
            <span className="text-xs text-slate-500">Active public bodies</span>
          </div>

          <div className="civic-card-3d p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Resolution</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : stats.resolvedIssues}
            </div>
            <span className="text-xs text-slate-500">Completed public works</span>
          </div>

          <div className="civic-card-3d p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Audit Integrity</span>
              <Lock className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 flex items-center gap-1.5">
              <span>{stats.auditValid ? 'Verified' : 'Check'}</span>
              <ShieldCheck className="w-5 h-5 text-emerald-600 inline" />
            </div>
            <span className="text-xs text-slate-500">SHA-256 ledger intact</span>
          </div>
        </div>
      </section>

      {/* Interactive Map & Recent Reports */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Interactive Civic Map & Recent Reports
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Real public issues documented across municipal wards. Coordinates generalized for privacy.
            </p>
          </div>
          <Link
            to="/issues"
            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            <span>View all reports on map</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Map View */}
        <div className="civic-card-3d rounded-2xl p-2 border border-slate-200">
          <CivicMap issues={issues} className="h-80 sm:h-96 w-full" />
        </div>

        {/* Recent Reports Grid */}
        {isLoading ? (
          <LoadingSpinner message="Fetching recent civic reports..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                to={`/issues/${issue.id}`}
                className="civic-card-3d rounded-2xl p-5 border border-slate-200 flex flex-col justify-between hover:border-blue-300 transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {issue.trackingId}
                    </span>
                    <StatusBadge status={issue.status} />
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition line-clamp-2">
                    {issue.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="font-medium text-slate-700">
                    <CategoryLabel category={issue.category} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>❤️ {issue.supportCount}</span>
                    <span>💬 {issue.commentCount}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How it Works Section */}
      <section className="bg-slate-100/70 py-12 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-5xl mx-auto space-y-8 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">How GovChain Works</h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Transparent 4-step accountability pipeline connecting citizens directly with public departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Report Problem</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Describe road craters, broken mains, or waste issues via form or conversational AI assistant.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Triage & Route</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Issue is assigned to responsible department (PWD, Water Board, etc.) with SLA tracking deadlines.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Public Progress</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track status updates, community comments, official work logs, and photo verification.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Tamper-Proof Audit</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every event, tender award, and vote is cryptographically hashed into an open audit ledger.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
