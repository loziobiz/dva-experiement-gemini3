import React, { useEffect, useRef } from 'react';
import { Submission } from '../../types';

interface SubmissionsMapViewProps {
  submissions: Submission[];
  onSubmissionClick: (id: string) => void;
}

const SubmissionsMapView: React.FC<SubmissionsMapViewProps> = ({ 
  submissions, 
  onSubmissionClick 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || !(window as any).google) return;

    const googleMaps = (window as any).google.maps;

    // Italy center coordinates
    const italyCenter = { lat: 42.5, lng: 12.5 };

    // Dark map styles
    const mapStyles = [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    ];

    // Initialize map if not exists
    if (!mapInstanceRef.current) {
      const map = new googleMaps.Map(mapRef.current, {
        center: italyCenter,
        zoom: 6, // Zoom level to see all of Italy
        styles: mapStyles,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: true,
        fullscreenControl: true,
      });
      mapInstanceRef.current = map;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create markers for each submission
    submissions.forEach(submission => {
      if (!submission.location?.coordinates) return;

      const { lat, lng } = submission.location.coordinates;
      
      // Determine marker color based on status
      const markerColor = submission.status === 'completed' ? '#10b981' : '#f59e0b';
      
      // Create custom marker icon
      const markerIcon = {
        path: googleMaps.SymbolPath.CIRCLE,
        fillColor: markerColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 10,
      };

      const marker = new googleMaps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        icon: markerIcon,
        title: submission.location.area,
        animation: googleMaps.Animation.DROP,
      });

      // Create info window content
      const infoContent = `
        <div style="padding: 8px; max-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #1f2937;">${submission.location.area}</div>
          <div style="font-size: 12px; color: #6b7280;">${submission.images.length} immagini</div>
          <div style="font-size: 12px; color: ${submission.status === 'completed' ? '#10b981' : '#f59e0b'}; margin-top: 4px;">
            ${submission.status === 'completed' ? '✓ Completato' : '⏳ In revisione'}
          </div>
        </div>
      `;

      const infoWindow = new googleMaps.InfoWindow({
        content: infoContent,
      });

      // Show info window on hover
      marker.addListener('mouseover', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      marker.addListener('mouseout', () => {
        infoWindow.close();
      });

      // Navigate to submission on click
      marker.addListener('click', () => {
        onSubmissionClick(submission.id);
      });

      markersRef.current.push(marker);
    });

    // Cleanup on unmount
    return () => {
      markersRef.current.forEach(marker => {
        (window as any).google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });
      markersRef.current = [];
    };
  }, [submissions, onSubmissionClick]);

  return (
    <div className="relative">
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-[600px] rounded-xl border border-secondary overflow-hidden"
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur border border-secondary rounded-lg p-3 text-sm">
        <div className="font-medium text-white mb-2">Legenda</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
          <span className="text-slate-300">In revisione</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
          <span className="text-slate-300">Completato</span>
        </div>
      </div>

      {/* Submissions count */}
      <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur border border-secondary rounded-lg px-3 py-2 text-sm">
        <span className="text-slate-400">Invii sulla mappa: </span>
        <span className="text-white font-medium">{submissions.length}</span>
      </div>
    </div>
  );
};

export default SubmissionsMapView;
