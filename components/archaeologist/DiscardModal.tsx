import React from 'react';
import { DiscardReason, DISCARD_REASON_LABELS } from '../../types';

interface DiscardModalProps {
  isOpen: boolean;
  isBulk?: boolean;
  selectedCount?: number;
  onConfirm: (reason: DiscardReason, comment?: string) => void;
  onCancel: () => void;
}

const DISCARD_REASONS: DiscardReason[] = [
  'poor_quality',
  'already_cataloged',
  'ai_false_positive',
  'not_archaeological',
  'insufficient_data'
];

const DiscardModal: React.FC<DiscardModalProps> = ({
  isOpen,
  isBulk = false,
  selectedCount = 1,
  onConfirm,
  onCancel
}) => {
  const [selectedReason, setSelectedReason] = React.useState<DiscardReason | null>(null);
  const [comment, setComment] = React.useState('');

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason, comment.trim() || undefined);
      // Reset state
      setSelectedReason(null);
      setComment('');
    }
  };

  const handleCancel = () => {
    setSelectedReason(null);
    setComment('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-surface border border-secondary rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-500">delete_forever</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Motivo dello scarto</h3>
            {isBulk && (
              <p className="text-sm text-slate-400">
                {selectedCount} {selectedCount === 1 ? 'immagine selezionata' : 'immagini selezionate'}
              </p>
            )}
          </div>
        </div>
        
        {/* Reasons */}
        <div className="space-y-2 mb-6">
          {DISCARD_REASONS.map(reason => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`
                w-full text-left px-4 py-3 rounded-lg border transition-colors
                ${selectedReason === reason 
                  ? 'bg-red-500/20 border-red-500 text-white' 
                  : 'bg-background border-secondary text-slate-300 hover:border-slate-500'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${selectedReason === reason 
                    ? 'border-red-500 bg-red-500' 
                    : 'border-slate-500'}
                `}>
                  {selectedReason === reason && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span>{DISCARD_REASON_LABELS[reason]}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Commento (opzionale)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder="Aggiungi dettagli aggiuntivi..."
            className="w-full bg-background border border-secondary rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary resize-none h-24"
          />
          <div className="text-right text-xs text-slate-500 mt-1">
            {comment.length}/500 caratteri
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedReason}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
              ${selectedReason 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
            `}
          >
            <span className="material-symbols-outlined text-lg">close</span>
            Conferma scarto
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscardModal;
