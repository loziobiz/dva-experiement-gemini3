import { ImageReviewStatus, DiscardReason, DroneImage } from '../types';
import { getSubmissions, updateSubmissionStatus } from './submissionService';

const STORAGE_KEY = 'dva_submissions';

/**
 * Save submissions to localStorage
 */
function saveSubmissions(submissions: any[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  } catch (error) {
    console.error('Failed to save submissions:', error);
  }
}

/**
 * Update the review status of a single image
 */
export function updateImageStatus(
  submissionId: string,
  imageId: string,
  status: ImageReviewStatus,
  discardReason?: DiscardReason,
  discardComment?: string
): DroneImage | undefined {
  const submissions = getSubmissions();
  const submissionIndex = submissions.findIndex(s => s.id === submissionId);
  
  if (submissionIndex === -1) return undefined;

  const imageIndex = submissions[submissionIndex].images.findIndex(
    (img: DroneImage) => img.id === imageId
  );
  
  if (imageIndex === -1) return undefined;

  // Update image review data
  submissions[submissionIndex].images[imageIndex].reviewData = {
    status,
    discardReason: status === 'discarded' ? discardReason : undefined,
    discardComment: status === 'discarded' ? discardComment : undefined,
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'Dr. archeologo' // Demo name
  };

  saveSubmissions(submissions);
  
  // Recalculate submission status
  updateSubmissionStatus(submissionId);
  
  return submissions[submissionIndex].images[imageIndex];
}

/**
 * Update the review status of multiple images (bulk action)
 */
export function bulkUpdateStatus(
  submissionId: string,
  imageIds: string[],
  status: ImageReviewStatus,
  discardReason?: DiscardReason,
  discardComment?: string
): DroneImage[] {
  const updatedImages: DroneImage[] = [];
  const submissions = getSubmissions();
  const submissionIndex = submissions.findIndex(s => s.id === submissionId);
  
  if (submissionIndex === -1) return [];

  const timestamp = new Date().toISOString();

  for (const imageId of imageIds) {
    const imageIndex = submissions[submissionIndex].images.findIndex(
      (img: DroneImage) => img.id === imageId
    );
    
    if (imageIndex !== -1) {
      submissions[submissionIndex].images[imageIndex].reviewData = {
        status,
        discardReason: status === 'discarded' ? discardReason : undefined,
        discardComment: status === 'discarded' ? discardComment : undefined,
        reviewedAt: timestamp,
        reviewedBy: 'Dr. archeologo' // Demo name
      };
      updatedImages.push(submissions[submissionIndex].images[imageIndex]);
    }
  }

  saveSubmissions(submissions);
  
  // Recalculate submission status
  updateSubmissionStatus(submissionId);
  
  return updatedImages;
}

/**
 * Get status icon for an image review status
 */
export function getStatusIcon(status: ImageReviewStatus): string {
  switch (status) {
    case 'pending_review':
      return 'schedule';
    case 'in_analysis':
      return 'search';
    case 'worthy_of_review':
      return 'star';
    case 'inconclusive':
      return 'help_outline';
    case 'discarded':
      return 'close';
    default:
      return 'schedule';
  }
}

/**
 * Check if a status represents a completed review
 */
export function isReviewed(status: ImageReviewStatus): boolean {
  return status !== 'pending_review';
}
