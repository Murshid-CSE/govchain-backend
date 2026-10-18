import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Issue, IssueCategory, IssueStatus } from '../types';
import { CivicMap } from '../components/map/CivicMap';
import { StatusBadge, PriorityBadge, CategoryLabel } from '../components/common/Badge';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../components/common/UIFeedback';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Search,
  MapPin,
  List,
  Map as MapIcon,
  PlusCircle,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';

export const IssuesPage: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');

  // Filters
  const search = searchParams.get('search') || '';
  const category = (searchParams.get('category') as IssueCategory) || '';
  const status = (searchParams.get('status') as IssueStatus) || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchIssues = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParts: string[] = [`page=${page}`, `limit=15`];
      if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
      if (category) queryParts.push(`category=${encodeURIComponent(category)}`);
      if (status) queryParts.push(`status=${encodeURIComponent(status)}`);

      const queryString = queryParts.join('&');
      const res = await api.get<{ issues: Issue[] }>(`/issues?${queryString}`);

      setIssues(res.data?.issues || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || (res.data?.issues?.length ?? 0));
    } catch (err: any) {
      setError(err.message || 'Failed to load civic issues.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [search, category, status, page]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = (formData.get('search') as string) || '';
    updateFilter('search', query);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            {t.navIssues}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, search, and monitor verified public works and citizen reports across local wards.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 inline mr-1" />
              Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5 inline mr-1" />
              List
            </button>
          </div>

          <Link
            to="/report"
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            {t.btnReportNow}
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="civic-card-3d p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search by problem title, keyword, or street..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </form>

          {/* Category Dropdown */}
          <div>
            <select
              aria-label="Filter by issue category"
              value={category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              <option value="road_damage">{t.catRoadDamage}</option>
              <option value="water_supply">{t.catWaterSupply}</option>
              <option value="drainage">{t.catDrainage}</option>
              <option value="waste_management">{t.catWasteManagement}</option>
              <option value="street_lights">{t.catStreetLights}</option>
              <option value="unsafe_construction">{t.catUnsafeConstruction}</option>
              <option value="corruption">{t.catCorruption}</option>
              <option value="other">{t.catOther}</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              aria-label="Filter by issue status"
              value={status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="submitted">{t.statusSubmitted}</option>
              <option value="verified">{t.statusVerified}</option>
              <option value="assigned">{t.statusAssigned}</option>
              <option value="in_progress">{t.statusInProgress}</option>
              <option value="resolved">{t.statusResolved}</option>
              <option value="rejected">{t.statusRejected}</option>
            </select>
          </div>
        </div>

        {/* Active Filters Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Found <strong>{totalCount}</strong> reports matching filters
          </span>
          {(search || category || status) && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="text-blue-600 hover:underline font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchIssues} />}

      {/* Main View Layout */}
      {isLoading ? (
        <LoadingSpinner message="Querying live issue database..." />
      ) : issues.length === 0 ? (
        <EmptyState
          title="No issues found"
          description="Try clearing your search query or filters to view other reports."
          action={{
            label: 'Report a New Problem',
            onClick: () => (window.location.href = '/report'),
          }}
        />
      ) : (
        <div
          className={`grid gap-6 ${
            viewMode === 'split'
              ? 'grid-cols-1 lg:grid-cols-12'
              : 'grid-cols-1'
          }`}
        >
          {/* Map Section */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div
              className={`${
                viewMode === 'split' ? 'lg:col-span-5 xl:col-span-6' : 'w-full'
              }`}
            >
              <div className="sticky top-20">
                <CivicMap
                  issues={issues}
                  className={`${viewMode === 'map' ? 'h-[75vh]' : 'h-[500px]'} w-full`}
                />
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  {t.locationApproxNote}
                </p>
              </div>
            </div>
          )}

          {/* List Section */}
          {(viewMode === 'split' || viewMode === 'list') && (
            <div
              className={`space-y-4 ${
                viewMode === 'split' ? 'lg:col-span-7 xl:col-span-6' : 'w-full'
              }`}
            >
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="civic-card-3d p-5 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-blue-400 transition"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {issue.trackingId}
                        </span>
                        <StatusBadge status={issue.status} />
                      </div>
                      <PriorityBadge priority={issue.priority} />
                    </div>

                    <Link to={`/issues/${issue.id}`} className="block group">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {issue.title}
                      </h3>
                    </Link>

                    <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {issue.description}
                    </p>

                    {issue.locationText && (
                      <div className="flex items-center text-xs text-slate-500 mt-3">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">{issue.locationText}</span>
                        {issue.ward && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            {issue.ward}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="font-medium text-slate-700">
                      <CategoryLabel category={issue.category} />
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <ThumbsUp className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {issue.supportCount}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {issue.commentCount}
                      </span>
                      <Link
                        to={`/issues/${issue.id}`}
                        className="font-semibold text-blue-600 hover:text-blue-800 transition pl-1"
                      >
                        Inspect &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => updateFilter('page', String(page - 1))}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    &larr; Previous
                  </button>
                  <span className="text-xs text-slate-500">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => updateFilter('page', String(page + 1))}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
