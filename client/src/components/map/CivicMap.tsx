import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Issue } from '../../types';

// Fix Leaflet default marker icons for Vite bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface CivicMapProps {
  issues?: Issue[];
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  isPicker?: boolean;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

export const CivicMap: React.FC<CivicMapProps> = ({
  issues = [],
  selectedLocation,
  onLocationSelect,
  isPicker = false,
  className = 'h-96 w-full',
  center = [13.0827, 80.2707], // Default Chennai coordinate
  zoom = 12,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        scrollWheelZoom: false,
      });

      // Standard OpenStreetMap with explicit legal attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle map clicks when in picker mode
      if (isPicker && onLocationSelect) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Issues Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const bounds = L.latLngBounds([]);
    let hasValidPoints = false;

    issues.forEach((issue) => {
      if (issue.latitude && issue.longitude) {
        hasValidPoints = true;
        bounds.extend([issue.latitude, issue.longitude]);

        // Status-based color coding
        let markerColor = '#3b82f6'; // blue
        if (issue.status === 'resolved') markerColor = '#10b981'; // green
        if (issue.priority === 'critical') markerColor = '#ef4444'; // red

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="background-color: ${markerColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon });

        const popupHtml = `
          <div style="font-family: inherit; font-size: 13px; max-width: 220px;">
            <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">${issue.title}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${issue.locationText || 'Location recorded'}</div>
            <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 8px;">
              <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase;">${issue.category.replace(/_/g, ' ')}</span>
              <span style="font-size: 11px; font-weight: 600; color: ${markerColor}; text-transform: capitalize;">${issue.status.replace(/_/g, ' ')}</span>
            </div>
            <a href="/issues/${issue.id}" style="display: inline-block; font-size: 11px; color: #2563eb; font-weight: 600; text-decoration: none;">View details &rarr;</a>
          </div>
        `;

        marker.bindPopup(popupHtml);
        markersLayerRef.current?.addLayer(marker);
      }
    });

    if (hasValidPoints && !isPicker && issues.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [issues, isPicker]);

  // Update Location Picker Marker
  useEffect(() => {
    if (!mapInstanceRef.current || !isPicker) return;

    if (selectedLocation) {
      const { lat, lng } = selectedLocation;

      if (!pickerMarkerRef.current) {
        const marker = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          if (onLocationSelect) onLocationSelect(pos.lat, pos.lng);
        });

        pickerMarkerRef.current = marker;
      } else {
        pickerMarkerRef.current.setLatLng([lat, lng]);
      }

      mapInstanceRef.current.panTo([lat, lng]);
    } else if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [selectedLocation, isPicker, onLocationSelect]);

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-sm border border-slate-200 ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {isPicker && (
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-700 shadow-sm border border-slate-200 pointer-events-none">
          Click map or drag pin to adjust coordinates
        </div>
      )}
    </div>
  );
};
