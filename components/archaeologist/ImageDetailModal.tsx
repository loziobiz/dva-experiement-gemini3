import React, { useEffect, useCallback, useState } from 'react';
import { 
  DroneImage, 
  ImageReviewStatus, 
  DiscardReason,
  STATUS_LABELS, 
  STATUS_COLORS,
  DISCARD_REASON_LABELS 
} from '../../types';
import { getStatusIcon } from '../../services/reviewService';

interface ImageDetailModalProps {
  isOpen: boolean;
  image: DroneImage | null;
  images: DroneImage[];
  onClose: () => void;
  onStatusChange: (imageId: string, status: ImageReviewStatus) => void;
  onDiscard: (imageId: string) => void;
  onNavigate: (imageId: string) => void;
  onRunAnalysis?: (imageId: string) => Promise<void>;
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  isOpen,
  image,
  images,
  onClose,
  onStatusChange,
  onDiscard,
  onNavigate,
  onRunAnalysis
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const currentIndex = image ? images.findIndex(img => img.id === image.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onNavigate(images[currentIndex - 1].id);
    }
  }, [hasPrev, images, currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onNavigate(images[currentIndex + 1].id);
    }
  }, [hasNext, images, currentIndex, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !image) return null;

  const status = image.reviewData?.status || 'pending_review';
  const colors = STATUS_COLORS[status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface border border-secondary rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary">
          <div className="flex items-center gap-3">
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1
              ${colors.bg} ${colors.border} border
            `}>
              <span className="material-symbols-outlined text-sm">{getStatusIcon(status)}</span>
              {STATUS_LABELS[status]}
            </span>
            <span className="text-slate-400 text-sm">
              {currentIndex + 1} di {images.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image */}
            <div className="relative">
              <img 
                src={image.previewUrl} 
                alt={image.name}
                className="w-full rounded-xl bg-background"
              />
              
              {/* Navigation Arrows */}
              {hasPrev && (
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
              )}
              {hasNext && (
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              )}
            </div>
            
            {/* Details */}
            <div className="space-y-6">
              {/* Metadata */}
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Metadati</h4>
                <div className="bg-background rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary">calendar_today</span>
                    <span className="text-slate-300">{image.metadata.date} {image.metadata.time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <span className="text-slate-300">
                      {image.metadata.coordinates.lat.toFixed(6)}°N, {image.metadata.coordinates.lng.toFixed(6)}°E
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary">flight</span>
                    <span className="text-slate-300">{image.metadata.droneModel || 'Non specificato'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary">terrain</span>
                    <span className="text-slate-300">{image.metadata.altitude}m altitudine</span>
                  </div>
                </div>
              </div>

              {/* AI Analysis - Always visible */}
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Analisi AI</h4>
                {image.aiAnalysis?.isAnalyzed ? (
                  <div className="bg-background rounded-xl p-4 space-y-4">
                    {/* Confidence */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Punteggio fiducia</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              image.aiAnalysis.confidence > 70 ? 'bg-emerald-500' : 
                              image.aiAnalysis.confidence > 40 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${image.aiAnalysis.confidence}%` }}
                          />
                        </div>
                        <span className="text-white font-mono text-sm">
                          {Math.round(image.aiAnalysis.confidence)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-slate-300 text-sm italic">
                      "{image.aiAnalysis.description}"
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {image.aiAnalysis.features.map((feature, idx) => (
                        <span 
                          key={idx}
                          className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-600"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-background rounded-xl p-4">
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center gap-3 py-4">
                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                        <span className="text-slate-300">Analisi in corso...</span>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">smart_toy</span>
                        <p className="text-slate-400 text-sm mb-4">Nessuna analisi AI disponibile</p>
                        {onRunAnalysis && (
                          <button
                            onClick={async () => {
                              setIsAnalyzing(true);
                              try {
                                await onRunAnalysis(image.id);
                              } finally {
                                setIsAnalyzing(false);
                              }
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-slate-900 font-medium rounded-lg hover:bg-emerald-400 transition-colors"
                          >
                            <span className="material-symbols-outlined">auto_awesome</span>
                            Esegui Analisi AI
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Discard info if discarded */}
              {status === 'discarded' && image.reviewData?.discardReason && (
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Motivo scarto</h4>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 font-medium">
                      {DISCARD_REASON_LABELS[image.reviewData.discardReason]}
                    </p>
                    {image.reviewData.discardComment && (
                      <p className="text-slate-400 text-sm mt-2">
                        "{image.reviewData.discardComment}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Azioni</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onStatusChange(image.id, 'worthy_of_review')}
                    disabled={status === 'worthy_of_review'}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors
                      ${status === 'worthy_of_review' 
                        ? 'bg-emerald-500 text-white cursor-default' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white'}
                    `}
                  >
                    <span className="material-symbols-outlined">star</span>
                    Meritevole
                  </button>
                  
                  <button
                    onClick={() => onStatusChange(image.id, 'inconclusive')}
                    disabled={status === 'inconclusive'}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors
                      ${status === 'inconclusive' 
                        ? 'bg-blue-500 text-white cursor-default' 
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white'}
                    `}
                  >
                    <span className="material-symbols-outlined">help_outline</span>
                    Non conclusiva
                  </button>
                  
                  <button
                    onClick={() => onStatusChange(image.id, 'in_analysis')}
                    disabled={status === 'in_analysis'}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors
                      ${status === 'in_analysis' 
                        ? 'bg-amber-500 text-white cursor-default' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white'}
                    `}
                  >
                    <span className="material-symbols-outlined">search</span>
                    In analisi
                  </button>
                  
                  <button
                    onClick={() => onDiscard(image.id)}
                    disabled={status === 'discarded'}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors
                      ${status === 'discarded' 
                        ? 'bg-red-500 text-white cursor-default' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white'}
                    `}
                  >
                    <span className="material-symbols-outlined">close</span>
                    Scarta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-secondary">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              className={`
                flex items-center gap-1 px-3 py-2 rounded-lg transition-colors
                ${hasPrev ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}
              `}
            >
              <span className="material-symbols-outlined">chevron_left</span>
              Precedente
            </button>
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className={`
                flex items-center gap-1 px-3 py-2 rounded-lg transition-colors
                ${hasNext ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}
              `}
            >
              Successiva
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-slate-900 font-medium hover:bg-emerald-400 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageDetailModal;
