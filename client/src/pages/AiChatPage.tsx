import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import type { ChatIntakeResponse, IssueCategory } from '../types';
import {
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AiChatPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am the GovChain Civic Assistant. Describe the public issue you noticed in your neighborhood (e.g. "large pothole near the station", "drinking water leak on 4th cross street"), and I will synthesize an editable report with category and priority recommendations for you.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [intakeResult, setIntakeResult] = useState<ChatIntakeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable draft state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftCategory, setDraftCategory] = useState<IssueCategory>('road_damage');
  const [draftLocation, setDraftLocation] = useState('');
  const [isSubmittingOfficial, setIsSubmittingOfficial] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: inputText.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post<ChatIntakeResponse>('/chat/intake', {
        messages: nextMessages,
      });

      if (res.data) {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: res.data.assistantReply,
        };
        setMessages([...nextMessages, assistantMsg]);
        setIntakeResult(res.data);

        // Pre-fill editable draft
        setDraftTitle(res.data.draftReport.title);
        setDraftDesc(res.data.draftReport.description);
        setDraftCategory(res.data.draftReport.suggestedCategory);
      }
    } catch (err: any) {
      setError(err.message || 'Chat intake service could not be reached.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndSubmit = async () => {
    if (!user) {
      setError('Please sign in before submitting your confirmed report.');
      return;
    }
    if (!draftTitle.trim() || !draftDesc.trim()) {
      setError('Title and description cannot be empty.');
      return;
    }

    setIsSubmittingOfficial(true);
    setError(null);
    try {
      const payload = {
        title: draftTitle.trim(),
        description: draftDesc.trim(),
        category: draftCategory,
        priority: intakeResult?.draftReport.suggestedPriority || 'medium',
        locationText: draftLocation.trim() || undefined,
        isPublic: true,
      };

      const res = await api.post<{ issue: { id: string; trackingId: string } }>('/issues', payload);
      if (res.data?.issue?.id) {
        navigate(`/issues/${res.data.issue.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please review fields.');
    } finally {
      setIsSubmittingOfficial(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            {t.navChat}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Converts citizen descriptions into verified, editable issue proposals with explainable priority suggestions.
          </p>
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          Guided Issue Triage (Rule-Based Heuristic Engine)
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Main Chat Conversation Container */}
      <div className="civic-card-3d rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-[480px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>Analyzing problem statement and assessing priority...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your civic issue description in plain language..."
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4 mr-1.5" />
            Send
          </button>
        </form>
      </div>

      {/* AI Draft Proposal & Confirmation Panel */}
      {intakeResult && (
        <div className="civic-card-3d p-6 sm:p-8 rounded-2xl border border-indigo-200 bg-white space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                Generated Draft Proposal — Ready for Review
              </h3>
            </div>
            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              Requires Citizen Confirmation
            </span>
          </div>

          {/* Potential duplicates banner */}
          {intakeResult.potentialDuplicates.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600" />
                Similar Existing Reports Detected
              </div>
              <p className="text-xs text-amber-800">
                The following nearby issues match your description. Check them first to avoid duplicate submissions:
              </p>
              <div className="space-y-1">
                {intakeResult.potentialDuplicates.map((dup) => (
                  <Link
                    key={dup.id}
                    to={`/issues/${dup.id}`}
                    className="block text-xs font-semibold text-blue-700 hover:underline"
                  >
                    • [{dup.trackingId}] {dup.title} ({dup.status})
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Priority explanation notice */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1">
            <span className="font-bold">
              Priority Suggestion: {intakeResult.draftReport.suggestedPriority.toUpperCase()}
            </span>
            <p className="text-indigo-800 leading-relaxed">
              {intakeResult.draftReport.priorityExplanation}
            </p>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Proposed Title
              </label>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value as IssueCategory)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Location / Landmark
                </label>
                <input
                  type="text"
                  value={draftLocation}
                  onChange={(e) => setDraftLocation(e.target.value)}
                  placeholder="Specify street or landmark name"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
                className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Legal / Ethics Disclaimer */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 italic">
            {t.aiDisclaimer}
          </div>

          {/* Final Submit Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <Link to="/report" className="text-xs font-semibold text-slate-600 hover:underline">
              Switch to Standard Manual Form
            </Link>

            <button
              type="button"
              disabled={isSubmittingOfficial}
              onClick={handleConfirmAndSubmit}
              className="inline-flex items-center px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {isSubmittingOfficial ? 'Publishing Report...' : 'Confirm & Log as Verified Issue'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
