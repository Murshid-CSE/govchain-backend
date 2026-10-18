import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { CivicMap } from '../components/map/CivicMap';
import type { IssueCategory, IssuePriority } from '../types';
import {
  AlertCircle,
  MapPin,
  Upload,
  CheckCircle2,
  Navigation,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const ReportIssuePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('road_damage');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [locationText, setLocationText] = useState('');
  const [ward, setWard] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Review & Submit state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successTrackingId, setSuccessTrackingId] = useState<string | null>(null);

  // Geolocation with user consent
  const handleGetGeolocation = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }
    setIsGettingLocation(true);
    setFormError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocationCoords(coords);
        if (!locationText) {
          setLocationText(`GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        }
        setIsGettingLocation(false);
      },
      (err) => {
        setFormError(`Location access denied or unavailable (${err.message}). You can select coordinates directly on the map.`);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleValidateBeforeReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (title.trim().length < 5) {
      setFormError('Title must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 10) {
      setFormError('Please provide a detailed description (at least 10 characters).');
      return;
    }

    if (!user) {
      setFormError('You must be signed in to submit a verified civic report.');
      return;
    }

    setShowReviewModal(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      // Optional photo upload if user attached files
      if (selectedFiles.length > 0) {
        await api.uploadFiles<{ files: any[] }>(selectedFiles);
      }

      // Submit issue to backend
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        locationText: locationText.trim() || undefined,
        ward: ward.trim() || undefined,
        latitude: locationCoords ? locationCoords.lat : undefined,
        longitude: locationCoords ? locationCoords.lng : undefined,
        isPublic: true,
      };

      const res = await api.post<{ issue: { id: string; trackingId: string } }>('/issues', payload);
      if (res.data?.issue?.trackingId) {
        setSuccessTrackingId(res.data.issue.trackingId);
        setShowReviewModal(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'Submission failed. Please check form inputs and retry.');
      setShowReviewModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successTrackingId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Report Submitted Successfully
        </h1>
        <p className="text-sm text-slate-600">
          Your civic problem report has been officially logged in the system. Use your unique tracking reference to monitor progress and departmental updates.
        </p>
        <div className="p-4 bg-slate-100 rounded-xl inline-block font-mono text-lg font-bold text-slate-900 border border-slate-300">
          {successTrackingId}
        </div>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            to={`/track/${successTrackingId}`}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
          >
            Track Report
          </Link>
          <Link
            to="/issues"
            className="px-5 py-2.5 rounded-xl border border-slate-300 font-semibold text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            Return to Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-blue-600" />
          {t.btnReportNow}
        </h1>
        <p className="text-sm text-slate-500">
          Provide complete, accurate problem details. You will review and confirm all details before final submission.
        </p>
      </div>

      {!user && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Authentication required to submit verified public reports.</span>
          </div>
          <Link to="/login" className="text-xs font-bold text-amber-800 underline">
            Sign In Now
          </Link>
        </div>
      )}

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {formError}
        </div>
      )}

      <form onSubmit={handleValidateBeforeReview} className="civic-card-3d p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Problem Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hazardous pothole cluster on Anna Salai Main Junction"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <span className="text-[11px] text-slate-400">Brief, clear summary (5-255 characters).</span>
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="road_damage">{t.catRoadDamage}</option>
              <option value="water_supply">{t.catWaterSupply}</option>
              <option value="drainage">{t.catDrainage}</option>
              <option value="waste_management">{t.catWasteManagement}</option>
              <option value="street_lights">{t.catStreetLights}</option>
              <option value="unsafe_construction">{t.catUnsafeConstruction}</option>
              <option value="transport">{t.catTransport}</option>
              <option value="public_facilities">{t.catPublicFacilities}</option>
              <option value="corruption">{t.catCorruption}</option>
              <option value="other">{t.catOther}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Severity / Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as IssuePriority)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="low">{t.priorityLow}</option>
              <option value="medium">{t.priorityMedium}</option>
              <option value="high">{t.priorityHigh}</option>
              <option value="critical">{t.priorityCritical}</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Detailed Description *
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the physical hazard, impact on traffic/residents, duration of problem, and surrounding landmarks..."
            className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <span className="text-[11px] text-slate-400">At least 10 characters.</span>
        </div>

        {/* Location Text & Ward */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Street Address / Landmark
            </label>
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="e.g. Near Guindy Metro Station, Opp. Bank"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Ward / Zone
            </label>
            <input
              type="text"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              placeholder="e.g. Ward 171"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Map Location Picker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Pin Exact Location on Map
            </label>
            <button
              type="button"
              disabled={isGettingLocation}
              onClick={handleGetGeolocation}
              className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <Navigation className="w-3.5 h-3.5 mr-1" />
              {isGettingLocation ? 'Detecting GPS...' : t.btnShareLocation}
            </button>
          </div>

          <CivicMap
            isPicker
            selectedLocation={locationCoords}
            onLocationSelect={(lat, lng) => setLocationCoords({ lat, lng })}
            className="h-64 w-full"
          />
          {locationCoords && (
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>Selected Coordinates: {locationCoords.lat.toFixed(5)}, {locationCoords.lng.toFixed(5)}</span>
              <button
                type="button"
                onClick={() => setLocationCoords(null)}
                className="text-rose-600 hover:underline"
              >
                Clear Pin
              </button>
            </div>
          )}
        </div>

        {/* File Attachments */}
        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Upload Evidence Photos (Optional)
          </label>
          <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-slate-400 transition bg-slate-50/50">
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-[11px] text-slate-400 mt-1">JPEG, PNG, or WEBP up to 5MB each.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Link to="/issues" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
            {t.btnCancel}
          </Link>
          <button
            type="submit"
            className="inline-flex items-center px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
          >
            Review & Confirm Report
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </form>

      {/* Review Modal Dialog */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">
              Confirm Report Submission
            </h3>
            <p className="text-xs text-slate-600">
              Please inspect the draft below. Once submitted, this report will enter the municipal review queue and receive a tracking reference.
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200">
              <div>
                <span className="font-semibold text-slate-500">Title: </span>
                <span className="font-bold text-slate-900">{title}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Category: </span>
                <span className="text-slate-900">{category.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Priority: </span>
                <span className="font-semibold uppercase text-slate-900">{priority}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Location: </span>
                <span className="text-slate-900">{locationText || 'Coordinates marked on map'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Description: </span>
                <p className="text-slate-700 mt-1 line-clamp-3">{description}</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              {t.civicDisclaimer}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="inline-flex items-center px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting to GovChain...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
