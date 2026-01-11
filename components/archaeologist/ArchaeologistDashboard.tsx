import React, { useState, useEffect } from 'react';
import { Submission, SubmissionStatus } from '../../types';
import { getSubmissions, deleteSubmission } from '../../services/submissionService';
import SubmissionCard from './SubmissionCard';
import SubmissionDetail from './SubmissionDetail';
import ConfirmationModal from './ConfirmationModal';
import SubmissionsMapView from './SubmissionsMapView';

type StatusFilter = 'all' | SubmissionStatus;
type ViewMode = 'grid' | 'map';

const ArchaeologistDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = () => {
    const data = getSubmissions();
    setSubmissions(data);
  };

  const handleSubmissionClick = (id: string) => {
    setSelectedSubmissionId(id);
  };

  const handleBack = () => {
    setSelectedSubmissionId(null);
    // Reload to reflect any changes made
    loadSubmissions();
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteSubmission(deleteConfirmId);
      setDeleteConfirmId(null);
      loadSubmissions();
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  // Get the submission to delete for the confirmation message
  const submissionToDelete = deleteConfirmId 
    ? submissions.find(s => s.id === deleteConfirmId) 
    : null;

  // Show detail view if a submission is selected
  if (selectedSubmissionId) {
    const submission = submissions.find(s => s.id === selectedSubmissionId);
    if (submission) {
      return (
        <SubmissionDetail 
          submission={submission} 
          onBack={handleBack}
          onUpdate={loadSubmissions}
        />
      );
    }
  }

  // Main dashboard view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          <span className="material-symbols-outlined text-primary mr-3 align-middle">inbox</span>
          Catalogo Invii
        </h2>
        <p className="text-slate-400">
          Gestisci e revisiona le immagini inviate dai piloti di droni per identificare potenziali siti archeologici.
        </p>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'grid'
                  ? 'bg-primary text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
              Griglia
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'map'
                  ? 'bg-primary text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">map</span>
              Mappa
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'grid' ? (
        <>
          {/* Status Filter - only show in grid view */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-slate-900'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Tutti ({submissions.length})
            </button>
            <button
              onClick={() => setStatusFilter('in_review')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'in_review'
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">schedule</span>
                In revisione ({submissions.filter(s => s.status === 'in_review').length})
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500 text-slate-900'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Completati ({submissions.filter(s => s.status === 'completed').length})
              </span>
            </button>
          </div>

          {/* Submissions Grid */}
          {(() => {
            const filteredSubmissions = statusFilter === 'all' 
              ? submissions 
              : submissions.filter(s => s.status === statusFilter);
            
            if (filteredSubmissions.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-slate-500">inbox</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {submissions.length === 0 
                      ? 'Nessun invio da revisionare' 
                      : `Nessun invio ${statusFilter === 'in_review' ? 'in revisione' : 'completato'}`}
                  </h3>
                  <p className="text-slate-400 max-w-md">
                    {submissions.length === 0 
                      ? 'Quando i piloti invieranno le loro immagini, appariranno qui per la revisione archeologica.'
                      : 'Cambia il filtro per vedere altri invii.'}
                  </p>
                </div>
              );
            }
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubmissions.map(submission => (
                  <SubmissionCard 
                    key={submission.id}
                    submission={submission}
                    onClick={handleSubmissionClick}
                    onDelete={handleDeleteRequest}
                  />
                ))}
              </div>
            );
          })()}
        </>
      ) : (
        /* Map View */
        <SubmissionsMapView
          submissions={submissions}
          onSubmissionClick={handleSubmissionClick}
        />
      )}

      {/* Stats Footer */}
      {submissions.length > 0 && (
        <div className="mt-8 pt-6 border-t border-secondary">
          <div className="flex items-center justify-center gap-8 text-sm text-slate-400">
            <span>
              <strong className="text-white">{submissions.length}</strong> invii totali
            </span>
            <span>
              <strong className="text-amber-400">
                {submissions.filter(s => s.status === 'in_review').length}
              </strong> in revisione
            </span>
            <span>
              <strong className="text-emerald-400">
                {submissions.filter(s => s.status === 'completed').length}
              </strong> completati
            </span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmId !== null}
        title="Elimina invio"
        message={`Sei sicuro di voler eliminare l'invio "${submissionToDelete?.location.area || ''}"? Questa azione è irreversibile e tutte le ${submissionToDelete?.images.length || 0} immagini verranno rimosse.`}
        confirmLabel="Elimina"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default ArchaeologistDashboard;

