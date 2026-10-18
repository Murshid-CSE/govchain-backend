import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { LoadingSpinner, ErrorBanner } from '../components/common/UIFeedback';
import {
  Search,
  Clock,
  Building2,
  Calendar,
  MapPin,
  Lock,
} from 'lucide-react';

export const TrackIssuePage: React.FC = () => {
  const { trackingId: routeTrackingId } = useParams<{ trackingId?: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(routeTrackingId || '');
  const [record, setRecord] = useState<any>(null);
  const [recordType, setRecordType] = useState<'issue' | 'grievance'>('issue');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLookup = async (idToTrack: string) => {
    const cleanId = idToTrack.trim().toUpperCase();
    if (!cleanId) return;

    setIsLoading(true);
    setError(null);
    setRecord(null);

    try {
      if (cleanId.startsWith('GRV-')) {
        // Track grievance
        const res = await api.get<{ grievance: any }>(`/grievances/track/${cleanId}`);
        if (res.data?.grievance) {
          setRecord(res.data.grievance);
          setRecordType('grievance');
        }
      } else {
        // Track issue (default)
        const res = await api.get<{ issue: any }>(`/issues/track/${cleanId}`);
        if (res.data?.issue) {
          setRecord(res.data.issue);
          setRecordType('issue');
        }
      }
    } catch (err: any) {
      setError(err.message || 'No record found with that tracking reference.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (routeTrackingId) {
      setSearchId(routeTrackingId);
      performLookup(routeTrackingId);
    }
  }, [routeTrackingId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/track/${searchId.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
          <Search className="w-7 h-7 text-blue-600" />
          {t.navTrack}
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Enter your reference token (e.g. <code>ISS-2026-00001</code> or <code>GRV-2026-00001</code>) to inspect live progress, departmental assignments, and verified milestones.
        </p>

        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto pt-2 flex gap-2">
          <input
            type="text"
            required
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="ISS-2026-00001"
            className="flex-1 px-4 py-2.5 text-sm uppercase font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Track Status
          </button>
        </form>
      </div>

      {isLoading && <LoadingSpinner message="Querying public tracking registry..." />}
      {error && <ErrorBanner message={error} />}

      {/* Record Details and Timeline */}
      {record && (
        <div className="civic-card-3d p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {record.trackingId}
              </span>
              <span className="ml-2 text-xs font-semibold uppercase text-slate-400">
                {recordType}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={record.status} />
              {record.priority && <PriorityBadge priority={record.priority} />}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              {record.title || record.subject}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {record.description}
            </p>
          </div>

          {/* Department & Location metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
              <span>Created {new Date(record.createdAt).toLocaleDateString()}</span>
            </div>
            {record.department && (
              <div className="flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                <span className="truncate">{record.department.name}</span>
              </div>
            )}
            {record.locationText && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                <span className="truncate">{record.locationText}</span>
              </div>
            )}
            {record.slaDeadline && (
              <div className="flex items-center text-amber-700 font-semibold sm:col-span-3">
                <Clock className="w-4 h-4 mr-2 shrink-0" />
                <span>SLA Resolution Target: {new Date(record.slaDeadline).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Privacy Protection Banner */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-100/60 p-2.5 rounded-lg border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Citizen PII Protected: Personal contact details and exact identity are strictly redacted from public tracking views.
            </span>
          </div>

          {/* Direct link for issues */}
          {recordType === 'issue' && (
            <div className="pt-2 flex justify-end">
              <Link
                to={`/issues/${record.id}`}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Open Full Community Discussion &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
