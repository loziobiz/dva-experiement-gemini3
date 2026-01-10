import React from 'react';
import { ImageReviewStatus, STATUS_LABELS } from '../../types';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onMarkWorthy: () => void;
  onMarkInconclusive: () => void;
  onDiscard: () => void;
  onClearSelection: () => void;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onMarkWorthy,
  onMarkInconclusive,
  onDiscard,
  onClearSelection
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-surface border border-secondary rounded-2xl shadow-2xl shadow-black/50 px-6 py-4 flex items-center gap-4">
        {/* Selection Count */}
        <div className="flex items-center gap-2 pr-4 border-r border-secondary">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {selectedCount}
          </div>
          <span className="text-slate-300 text-sm">
            {selectedCount === 1 ? 'selezionata' : 'selezionate'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onMarkWorthy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-lg">star</span>
            Meritevoli
          </button>
          
          <button
            onClick={onMarkInconclusive}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-lg">help_outline</span>
            Non conclusive
          </button>
          
          <button
            onClick={onDiscard}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-lg">close</span>
            Scarta
          </button>
        </div>

        {/* Clear */}
        <button
          onClick={onClearSelection}
          className="ml-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Deseleziona tutto"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
