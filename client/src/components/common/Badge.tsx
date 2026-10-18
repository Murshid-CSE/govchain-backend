import React from 'react';
import type { IssueStatus, IssuePriority, IssueCategory } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

export const StatusBadge: React.FC<{ status: IssueStatus | string }> = ({ status }) => {
  const { t } = useLanguage();

  const getStatusConfig = (s: string) => {
    switch (s) {
      case 'resolved':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: t.statusResolved };
      case 'in_progress':
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: t.statusInProgress };
      case 'assigned':
        return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: t.statusAssigned };
      case 'verified':
        return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: t.statusVerified };
      case 'published':
        return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: t.statusPublished };
      case 'under_moderation':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: t.statusUnderModeration };
      case 'rejected':
        return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: t.statusRejected };
      case 'closed':
        return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: t.statusClosed };
      default:
        return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: t.statusSubmitted };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75" />
      {config.label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: IssuePriority | string }> = ({ priority }) => {
  const { t } = useLanguage();

  switch (priority) {
    case 'critical':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          ⚠️ {t.priorityCritical}
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
          ▲ {t.priorityHigh}
        </span>
      );
    case 'low':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
          ▼ {t.priorityLow}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          ● {t.priorityMedium}
        </span>
      );
  }
};

export const CategoryLabel: React.FC<{ category: IssueCategory | string }> = ({ category }) => {
  const { t } = useLanguage();

  const labels: Record<string, string> = {
    road_damage: t.catRoadDamage,
    unsafe_construction: t.catUnsafeConstruction,
    water_supply: t.catWaterSupply,
    drainage: t.catDrainage,
    waste_management: t.catWasteManagement,
    street_lights: t.catStreetLights,
    transport: t.catTransport,
    public_facilities: t.catPublicFacilities,
    education: t.catEducation,
    healthcare: t.catHealthcare,
    environment: t.catEnvironment,
    corruption: t.catCorruption,
    noise: t.catNoise,
    encroachment: t.catEncroachment,
    other: t.catOther,
  };

  return <span>{labels[category] || category.replace(/_/g, ' ')}</span>;
};
