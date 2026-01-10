import React, { useState } from 'react';
import { Submission, DroneImage, ImageReviewStatus, DiscardReason } from '../../types';
import { getSubmissionStats, getSubmissionById } from '../../services/submissionService';
import { updateImageStatus, bulkUpdateStatus } from '../../services/reviewService';
import ImageCard from './ImageCard';
import BulkActionsToolbar from './BulkActionsToolbar';
import ImageDetailModal from './ImageDetailModal';
import DiscardModal from './DiscardModal';
import ConfirmationModal from './ConfirmationModal';

interface SubmissionDetailProps {
  submission: Submission;
  onBack: () => void;
  onUpdate: () => void;
}

const SubmissionDetail: React.FC<SubmissionDetailProps> = ({ submission, onBack, onUpdate }) => {
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [viewingImage, setViewingImage] = useState<DroneImage | null>(null);
  const [localSubmission, setLocalSubmission] = useState<Submission>(submission);
  
  // Modal states
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'worthy' | 'inconclusive';
    imageIds: string[];
  } | null>(null);
  const [singleDiscardImageId, setSingleDiscardImageId] = useState<string | null>(null);

  const stats = getSubmissionStats(localSubmission);

  // Format date
  const date = new Date(localSubmission.submittedAt);
  const formattedDate = date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Toggle image selection
  const handleImageClick = (imageId: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      setSelectedImageIds(prev => 
        prev.includes(imageId) 
          ? prev.filter(id => id !== imageId) 
          : [...prev, imageId]
      );
    } else {
      setSelectedImageIds(prev => 
        prev.includes(imageId) && prev.length === 1 
          ? [] 
          : [imageId]
      );
    }
  };

  // View image in modal
  const handleViewImage = (image: DroneImage) => {
    setViewingImage(image);
  };

  // Update a single image status (from modal)
  const handleStatusChange = (imageId: string, status: ImageReviewStatus) => {
    updateImageStatus(localSubmission.id, imageId, status);
    refreshSubmission();
  };

  // Open discard modal for single image
  const handleDiscardSingle = (imageId: string) => {
    setSingleDiscardImageId(imageId);
    setShowDiscardModal(true);
  };

  // Confirm single discard
  const handleConfirmDiscard = (reason: DiscardReason, comment?: string) => {
    if (singleDiscardImageId) {
      updateImageStatus(localSubmission.id, singleDiscardImageId, 'discarded', reason, comment);
    } else if (selectedImageIds.length > 0) {
      bulkUpdateStatus(localSubmission.id, selectedImageIds, 'discarded', reason, comment);
      setSelectedImageIds([]);
    }
    setSingleDiscardImageId(null);
    setShowDiscardModal(false);
    refreshSubmission();
  };

  // Bulk actions
  const handleBulkMarkWorthy = () => {
    setPendingAction({ type: 'worthy', imageIds: [...selectedImageIds] });
    setShowConfirmModal(true);
  };

  const handleBulkMarkInconclusive = () => {
    setPendingAction({ type: 'inconclusive', imageIds: [...selectedImageIds] });
    setShowConfirmModal(true);
  };

  const handleBulkDiscard = () => {
    setShowDiscardModal(true);
  };

  const handleConfirmBulkAction = () => {
    if (pendingAction) {
      const status: ImageReviewStatus = pendingAction.type === 'worthy' ? 'worthy_of_review' : 'inconclusive';
      bulkUpdateStatus(localSubmission.id, pendingAction.imageIds, status);
      setSelectedImageIds([]);
      setPendingAction(null);
      setShowConfirmModal(false);
      refreshSubmission();
    }
  };

  // Refresh submission data from storage
  const refreshSubmission = () => {
    const updated = getSubmissionById(localSubmission.id);
    if (updated) {
      setLocalSubmission(updated);
      // Also update viewing image if it's open
      if (viewingImage) {
        const updatedImage = updated.images.find((img: DroneImage) => img.id === viewingImage.id);
        if (updatedImage) {
          setViewingImage(updatedImage);
        }
      }
    }
    onUpdate();
  };

  // Navigate to another image in the modal
  const handleNavigateImage = (imageId: string) => {
    const image = localSubmission.images.find(img => img.id === imageId);
    if (image) {
      setViewingImage(image);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Torna alla lista
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {localSubmission.location.area}
            </h2>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">person</span>
                {localSubmission.submitterName}
              </span>
              <span className={`
                px-2 py-1 rounded text-xs font-bold
                ${localSubmission.status === 'completed' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/20 text-amber-400'}
              `}>
                {localSubmission.status === 'completed' ? 'Completato' : 'In revisione'}
              </span>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-slate-400">Totali</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{stats.worthy}</div>
              <div className="text-slate-400">Meritevoli</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">{stats.pending}</div>
              <div className="text-slate-400">In attesa</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.discarded}</div>
              <div className="text-slate-400">Scartate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Help */}
      <div className="mb-4 text-sm text-slate-500">
        <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
        Usa <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Ctrl</kbd> + click per selezionare più immagini
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {localSubmission.images.map(image => (
          <ImageCard
            key={image.id}
            image={image}
            isSelected={selectedImageIds.includes(image.id)}
            onClick={(e) => handleImageClick(image.id, e)}
            onView={() => handleViewImage(image)}
          />
        ))}
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedImageIds.length}
        onMarkWorthy={handleBulkMarkWorthy}
        onMarkInconclusive={handleBulkMarkInconclusive}
        onDiscard={handleBulkDiscard}
        onClearSelection={() => setSelectedImageIds([])}
      />

      {/* Image Detail Modal */}
      <ImageDetailModal
        isOpen={viewingImage !== null}
        image={viewingImage}
        images={localSubmission.images}
        onClose={() => setViewingImage(null)}
        onStatusChange={handleStatusChange}
        onDiscard={handleDiscardSingle}
        onNavigate={handleNavigateImage}
      />

      {/* Discard Modal */}
      <DiscardModal
        isOpen={showDiscardModal}
        isBulk={!singleDiscardImageId && selectedImageIds.length > 1}
        selectedCount={singleDiscardImageId ? 1 : selectedImageIds.length}
        onConfirm={handleConfirmDiscard}
        onCancel={() => {
          setShowDiscardModal(false);
          setSingleDiscardImageId(null);
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Conferma azione"
        message={`Stai per marcare ${pendingAction?.imageIds.length || 0} ${
          (pendingAction?.imageIds.length || 0) === 1 ? 'immagine' : 'immagini'
        } come ${pendingAction?.type === 'worthy' ? 'meritevoli di approfondimento' : 'non conclusive'}.`}
        confirmLabel="Conferma"
        onConfirm={handleConfirmBulkAction}
        onCancel={() => {
          setShowConfirmModal(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
};

export default SubmissionDetail;
