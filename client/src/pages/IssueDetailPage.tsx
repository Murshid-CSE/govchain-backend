import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import type { Issue } from '../types';
import { StatusBadge, PriorityBadge, CategoryLabel } from '../components/common/Badge';
import { LoadingSpinner, ErrorBanner } from '../components/common/UIFeedback';
import { CivicMap } from '../components/map/CivicMap';
import {
  ThumbsUp,
  MessageSquare,
  MapPin,
  Calendar,
  Building2,
  ArrowLeft,
  Send,
} from 'lucide-react';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSupporting, setIsSupporting] = useState(false);
  const [hasSupported, setHasSupported] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ issue: Issue }>(`/issues/${id}`);
      if (res.data?.issue) {
        setIssue(res.data.issue);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load issue details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSupportToggle = async () => {
    if (!user) {
      setActionMessage('Please sign in to support this issue.');
      return;
    }
    if (!issue) return;

    setIsSupporting(true);
    setActionMessage(null);
    try {
      if (hasSupported) {
        await api.delete(`/issues/${issue.id}/support`);
        setIssue((prev) => (prev ? { ...prev, supportCount: Math.max(0, prev.supportCount - 1) } : prev));
        setHasSupported(false);
      } else {
        await api.post(`/issues/${issue.id}/support`);
        setIssue((prev) => (prev ? { ...prev, supportCount: prev.supportCount + 1 } : prev));
        setHasSupported(true);
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Support action could not be processed.');
    } finally {
      setIsSupporting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setActionMessage('Please sign in to submit a comment.');
      return;
    }
    if (!commentText.trim() || !issue) return;

    setIsSubmittingComment(true);
    setActionMessage(null);
    try {
      const res = await api.post<{ comment: any }>(`/issues/${issue.id}/comments`, {
        content: commentText.trim(),
      });
      if (res.data?.comment) {
        setIssue((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            commentCount: prev.commentCount + 1,
            comments: [...(prev.comments || []), res.data!.comment],
          };
        });
        setCommentText('');
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading verified issue record..." />;
  if (error || !issue) return <ErrorBanner message={error || 'Issue not found.'} onRetry={fetchDetail} />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/issues"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to all issues
        </Link>
        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          {issue.trackingId}
        </span>
      </div>

      {actionMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800">
          {actionMessage}
        </div>
      )}

      {/* Main Issue Header Card */}
      <div className="civic-card-3d p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Category: <CategoryLabel category={issue.category} />
          </span>
        </div>

        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
          {issue.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
          {issue.description}
        </p>

        {/* Metadata info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
            <span>Reported on {new Date(issue.createdAt).toLocaleDateString()}</span>
          </div>
          {issue.locationText && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
              <span className="truncate">{issue.locationText}</span>
            </div>
          )}
          {issue.department && (
            <div className="flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
              <span className="truncate">{issue.department.name}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={isSupporting}
              onClick={handleSupportToggle}
              className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                hasSupported
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
              {hasSupported ? t.btnSupported : t.btnSupport} ({issue.supportCount})
            </button>
            <span className="text-xs text-slate-500 flex items-center">
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              {issue.commentCount} Comments
            </span>
          </div>

          <Link
            to={`/track/${issue.trackingId}`}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Open Public Tracking Timeline &rarr;
          </Link>
        </div>
      </div>

      {/* Map Location Section */}
      {issue.latitude && issue.longitude && (
        <div className="civic-card-3d p-6 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Location & Surrounding Ward
          </h3>
          <CivicMap
            issues={[issue]}
            center={[issue.latitude, issue.longitude]}
            zoom={15}
            className="h-64 w-full"
          />
          <p className="text-[11px] text-slate-500">
            Coordinates: {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)} ({issue.ward || 'General ward'})
          </p>
        </div>
      )}

      {/* Community Comments & Official Logs */}
      <div className="civic-card-3d p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Community Discussion & Official Notes ({issue.comments?.length || 0})
        </h3>

        {/* Comment Submission */}
        {user ? (
          <form onSubmit={handleAddComment} className="space-y-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add relevant observations, updates, or municipal contact notes..."
              rows={3}
              className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {isSubmittingComment ? 'Submitting...' : t.btnAddComment}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-center">
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Sign in
            </Link>{' '}
            to join the discussion and post observations.
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4 pt-2">
          {(!issue.comments || issue.comments.length === 0) ? (
            <p className="text-xs text-slate-400 italic">No comments posted yet.</p>
          ) : (
            issue.comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-xl border ${
                  comment.isOfficial
                    ? 'bg-blue-50/50 border-blue-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900">{comment.user?.name || 'Resident'}</span>
                    {comment.isOfficial && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                        Official Response
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
