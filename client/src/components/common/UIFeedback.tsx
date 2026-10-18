import React from 'react';
import { AlertTriangle, RefreshCw, Inbox } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading civic data...',
  className = 'py-12',
}) => (
  <div className={`flex flex-col items-center justify-center text-slate-500 ${className}`} role="status">
    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
    <span className="text-sm font-medium">{message}</span>
  </div>
);

export const ErrorBanner: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Failed to load data', message, onRetry }) => (
  <div
    className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 my-4"
    role="alert"
  >
    <div className="flex items-start">
      <AlertTriangle className="w-5 h-5 text-rose-600 mr-3 mt-0.5 shrink-0" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-sm text-rose-700 mt-1">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Try Again
          </button>
        )}
      </div>
    </div>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ title, description, action }) => (
  <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-300 bg-white/50">
    <Inbox className="w-10 h-10 text-slate-400 mx-auto mb-3" />
    <h3 className="text-base font-semibold text-slate-800">{title}</h3>
    <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">{description}</p>
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        {action.label}
      </button>
    )}
  </div>
);
