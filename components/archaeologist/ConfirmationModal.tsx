import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-surface border border-secondary rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in">
        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        
        {/* Message */}
        <p className="text-slate-300 mb-6">{message}</p>
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${confirmVariant === 'danger' 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-primary text-slate-900 hover:bg-emerald-400'}
            `}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
