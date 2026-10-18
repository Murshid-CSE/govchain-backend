import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import type { Tender, BudgetAllocation, Poll, Department, AuditVerificationResult } from '../types';
import { LoadingSpinner, ErrorBanner } from '../components/common/UIFeedback';
import {
  BarChart3,
  ShieldCheck,
  FileSpreadsheet,
  Vote,
  Building2,
  Lock,
  RefreshCw,
} from 'lucide-react';

export const TransparencyPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'audit';
  const { user } = useAuth();
  const { t } = useLanguage();

  const [auditResult, setAuditResult] = useState<AuditVerificationResult | null>(null);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [budgets, setBudgets] = useState<BudgetAllocation[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const loadTabData = async () => {
    setIsLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      if (activeTab === 'audit') {
        const res = await api.get<AuditVerificationResult>('/audit/verify');
        if (res.data) setAuditResult(res.data);
      } else if (activeTab === 'tenders') {
        const res = await api.get<{ tenders: Tender[] }>('/tenders');
        setTenders(res.data?.tenders || []);
      } else if (activeTab === 'budgets') {
        const res = await api.get<{ allocations: BudgetAllocation[] }>('/budgets');
        setBudgets(res.data?.allocations || []);
      } else if (activeTab === 'polls') {
        const res = await api.get<{ polls: Poll[] }>('/polls');
        setPolls(res.data?.polls || []);
      } else if (activeTab === 'departments') {
        const res = await api.get<{ departments: Department[] }>('/departments');
        setDepartments(res.data?.departments || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transparency records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const handleCastVote = async (pollId: string, optionId: string) => {
    if (!user) {
      setError('Please sign in to vote in community civic polls.');
      return;
    }
    setVotingOptionId(optionId);
    setError(null);
    try {
      await api.post(`/polls/${pollId}/vote`, { optionId });
      setActionSuccess('Your civic vote has been cryptographically recorded.');
      loadTabData(); // Refresh vote totals
    } catch (err: any) {
      setError(err.message || 'Voting failed. You may have already voted on this poll.');
    } finally {
      setVotingOptionId(null);
    }
  };

  const formatRupees = (paiseStr: string) => {
    try {
      const paise = BigInt(paiseStr || '0');
      const rupees = Number(paise / 100n);
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(rupees);
    } catch {
      return `₹${paiseStr}`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-blue-600" />
          {t.navTransparency}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Open-access portal for municipal budgets, public tenders, citizen polls, and cryptographic audit proofs.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2">
        <button
          type="button"
          onClick={() => setTab('audit')}
          className={`flex items-center px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5 mr-1.5" />
          Cryptographic Audit Ledger
        </button>
        <button
          type="button"
          onClick={() => setTab('tenders')}
          className={`flex items-center px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'tenders'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
          Public Tenders
        </button>
        <button
          type="button"
          onClick={() => setTab('budgets')}
          className={`flex items-center px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'budgets'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
          Departmental Budgets
        </button>
        <button
          type="button"
          onClick={() => setTab('polls')}
          className={`flex items-center px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'polls'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Vote className="w-3.5 h-3.5 mr-1.5" />
          Civic Sentiment Polls
        </button>
        <button
          type="button"
          onClick={() => setTab('departments')}
          className={`flex items-center px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'departments'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 mr-1.5" />
          Departments
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          {actionSuccess}
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={loadTabData} />}
      {isLoading && <LoadingSpinner message="Fetching verified transparency records..." />}

      {/* Tab 1: Cryptographic Audit Ledger */}
      {!isLoading && activeTab === 'audit' && auditResult && (
        <div className="space-y-6">
          <div className="civic-card-3d p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    auditResult.valid
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Chain Status: {auditResult.valid ? 'Verified Intact' : 'Discrepancy Detected'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {auditResult.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadTabData}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Re-verify
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Total Hashed Events:</span>
                <div className="font-bold text-slate-900 text-base">{auditResult.totalEvents}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Last Verified At:</span>
                <div className="font-bold text-slate-900 text-base">
                  {new Date(auditResult.verifiedAt).toLocaleTimeString()}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Cryptographic Standard:</span>
                <div className="font-bold text-slate-900 text-base">SHA-256 Chronological</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
              Note: The audit chain cryptographically seals all civic state transitions (issue creation, status updates, budget expenditures, tender awards). Any retroactive manual database tampering breaks the chronological hash link.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Public Tenders */}
      {!isLoading && activeTab === 'tenders' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Public municipal procurement notices with mandatory justification requirements for awarded contracts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tenders.map((tender) => (
              <div key={tender.id} className="civic-card-3d p-6 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {tender.category}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 uppercase">
                    {tender.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{tender.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {tender.description}
                </p>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Budget:</span>
                    <span className="font-bold text-slate-900">{formatRupees(tender.budgetAmountPaise)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bidding Deadline:</span>
                    <span className="text-slate-700">{new Date(tender.deadline).toLocaleDateString()}</span>
                  </div>
                  {tender.department && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Issuing Department:</span>
                      <span className="font-semibold text-slate-800">{tender.department.name}</span>
                    </div>
                  )}
                </div>

                {tender.awardReason && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                    <span className="font-bold text-emerald-900">Award Justification:</span>
                    <p className="text-emerald-800 mt-1">{tender.awardReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Departmental Budgets */}
      {!isLoading && activeTab === 'budgets' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Municipal budget allocations and itemized expenditures by fiscal year and civic department.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {budgets.map((budget) => {
              const allocated = Number(BigInt(budget.allocatedPaise || '0') / 100n);
              const spent = Number(BigInt(budget.spentPaise || '0') / 100n);
              const pct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

              return (
                <div key={budget.id} className="civic-card-3d p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      FY {budget.fiscalYear}
                    </span>
                    <span className="text-slate-500">{budget.category}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">
                    {budget.department?.name || 'Municipal Works'}
                  </h3>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Utilization: {pct}%</span>
                      <span className="font-bold text-slate-900">
                        {formatRupees(budget.spentPaise)} / {formatRupees(budget.allocatedPaise)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct > 90 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {budget.expenditures && budget.expenditures.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700">Recent Expenditures:</span>
                      {budget.expenditures.map((exp) => (
                        <div key={exp.id} className="flex justify-between text-[11px] text-slate-600">
                          <span className="truncate max-w-[200px]">{exp.description}</span>
                          <span className="font-semibold">{formatRupees(exp.amountPaise)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Civic Sentiment Polls */}
      {!isLoading && activeTab === 'polls' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Community sentiment initiatives. Note: Civic polls reflect verified community opinions and are not legally binding public elections.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {polls.map((poll) => (
              <div key={poll.id} className="civic-card-3d p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    Community Sentiment
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    {poll.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{poll.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{poll.description}</p>

                {/* Poll Options & Voting */}
                <div className="space-y-2 pt-2">
                  {poll.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition flex items-center justify-between gap-3 bg-slate-50/50"
                    >
                      <div className="text-xs font-medium text-slate-800">
                        {opt.label}
                        <span className="ml-2 font-bold text-slate-500">({opt.votes} votes)</span>
                      </div>

                      {poll.status === 'active' && (
                        <button
                          type="button"
                          disabled={votingOptionId === opt.id}
                          onClick={() => handleCastVote(poll.id, opt.id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {votingOptionId === opt.id ? 'Voting...' : 'Vote'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Departments */}
      {!isLoading && activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div key={dept.id} className="civic-card-3d p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {dept.description}
              </p>
              {dept.contactEmail && (
                <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                  Email: {dept.contactEmail}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
