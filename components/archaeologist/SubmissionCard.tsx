import React from 'react';
import { Submission, STATUS_LABELS } from '../../types';
import { getSubmissionStats } from '../../services/submissionService';

interface SubmissionCardProps {
  submission: Submission;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission, onClick, onDelete }) => {
  const stats = getSubmissionStats(submission);
  
  // Format date
  const date = new Date(submission.submittedAt);
  const formattedDate = date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening detail view
    onDelete(submission.id);
  };

  return (
    <div 
      onClick={() => onClick(submission.id)}
      className="bg-surface border border-secondary rounded-xl p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group relative"
    >
      {/* Delete Button */}
      <button
        onClick={handleDeleteClick}
        className="absolute top-3 right-3 p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        title="Elimina invio"
      >
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>
      {/* Location & Date */}
      <div className="mb-4">
        <div className="flex items-start gap-2 mb-2">
          <span className="material-symbols-outlined text-primary text-lg">location_on</span>
          <h3 className="font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors">
            {submission.location.area}
          </h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            {formattedDate} - {formattedTime}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-2 text-sm text-slate-400">
          <span className="material-symbols-outlined text-sm">person</span>
          {submission.submitterName}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-secondary mb-4"></div>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-slate-400 text-lg">photo_library</span>
          <span className="text-slate-300">{stats.total} immagini totali</span>
        </div>
        
        {stats.worthy > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-emerald-500 text-lg">star</span>
            <span className="text-emerald-400">{stats.worthy} meritevoli</span>
          </div>
        )}
        
        {stats.discarded > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-red-500 text-lg">close</span>
            <span className="text-red-400">{stats.discarded} scartate</span>
          </div>
        )}
        
        {stats.pending > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-slate-500 text-lg">schedule</span>
            <span className="text-slate-400">{stats.pending} in attesa</span>
          </div>
        )}

        {stats.inconclusive > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-blue-500 text-lg">help_outline</span>
            <span className="text-blue-400">{stats.inconclusive} non conclusive</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-secondary mb-4"></div>

      {/* Status Badge & Arrow */}
      <div className="flex items-center justify-between">
        <span className={`
          text-xs font-bold px-3 py-1.5 rounded-full
          ${submission.status === 'completed' 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}
        `}>
          {submission.status === 'completed' ? 'Completato' : 'In revisione'}
        </span>
        
        <span className="text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all">
          <span className="material-symbols-outlined">arrow_forward</span>
        </span>
      </div>
    </div>
  );
};

export default SubmissionCard;
