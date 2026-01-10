import React from 'react';
import { DroneImage, STATUS_COLORS, STATUS_LABELS_SHORT, ImageReviewStatus } from '../../types';
import { getStatusIcon } from '../../services/reviewService';

interface ImageCardProps {
  image: DroneImage;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onView: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, isSelected, onClick, onView }) => {
  const status: ImageReviewStatus = image.reviewData?.status || 'pending_review';
  const colors = STATUS_COLORS[status];
  const icon = getStatusIcon(status);
  
  const isDiscarded = status === 'discarded';

  // Safe access to metadata with fallbacks
  const imageDate = image.metadata?.date || 'N/A';
  const previewUrl = image.previewUrl || '';

  // Handle checkbox click - toggle selection
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Simulate ctrl+click to toggle selection
    const syntheticEvent = {
      ...e,
      ctrlKey: true,
      metaKey: true
    } as React.MouseEvent;
    onClick(syntheticEvent);
  };

  // Handle card click - if clicking directly on card (not checkbox), view the image
  const handleCardClick = (e: React.MouseEvent) => {
    // Check if the click was on the checkbox area
    const target = e.target as HTMLElement;
    if (target.closest('[data-checkbox]')) {
      return; // Let the checkbox handler deal with it
    }
    onView();
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`
        relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group
        border-2 ${colors.border}
        ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/20' : ''}
        ${isDiscarded ? 'opacity-60' : ''}
        hover:scale-[1.02] hover:shadow-xl
      `}
    >
      {/* Image */}
      <div className="aspect-square bg-slate-800">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt={image.name || 'Image'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken images
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-4xl">image</span>
          </div>
        )}
      </div>

      {/* Status Badge with Text */}
      <div className={`
        absolute top-2 left-2 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5
        ${colors.bg} backdrop-blur-sm border ${colors.border} shadow-lg
      `}>
        <span className="material-symbols-outlined text-sm">{icon}</span>
        <span className="hidden sm:inline">{STATUS_LABELS_SHORT[status]}</span>
      </div>

      {/* Discarded Overlay */}
      {isDiscarded && (
        <div className="absolute inset-0 bg-red-900/40 pointer-events-none flex items-center justify-center">
          <div className="bg-red-500/80 backdrop-blur-sm px-3 py-1.5 rounded-lg rotate-[-12deg]">
            <span className="text-white font-bold text-sm">SCARTATA</span>
          </div>
        </div>
      )}

      {/* Selection Checkbox */}
      <div 
        data-checkbox
        onClick={handleCheckboxClick}
        className={`
          absolute top-2 right-2 w-8 h-8 rounded-md border-2 flex items-center justify-center
          transition-all cursor-pointer z-10 hover:scale-110
          ${isSelected 
            ? 'bg-primary border-primary text-slate-900' 
            : 'bg-slate-900/70 border-slate-500 hover:border-primary hover:bg-slate-800'}
        `}
      >
        {isSelected && (
          <span className="material-symbols-outlined text-sm font-bold">check</span>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-10">
        {/* Image Name */}
        <p className="text-xs font-bold text-white truncate mb-1">{image.name || 'Immagine'}</p>
        
        {/* Meta Info */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-300 bg-black/40 px-1.5 py-0.5 rounded">
            {imageDate}
          </span>
          
          {/* AI Score if analyzed */}
          {image.aiAnalysis?.isAnalyzed && (
            <span className={`
              text-[10px] px-1.5 py-0.5 rounded font-bold
              ${image.aiAnalysis.confidence > 70 
                ? 'bg-primary text-slate-900' 
                : 'bg-slate-600 text-slate-200'}
            `}>
              AI: {Math.round(image.aiAnalysis.confidence)}%
            </span>
          )}
        </div>
      </div>

      {/* View Icon in corner (on hover) */}
      <div 
        className="
          absolute bottom-16 right-2 opacity-0 group-hover:opacity-100 
          transition-opacity z-10
        "
      >
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-2 hover:bg-primary hover:border-primary transition-colors">
          <span className="material-symbols-outlined text-lg text-white">visibility</span>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
