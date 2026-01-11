import { Submission, DroneImage, SubmissionStatus } from '../types';
import { getAreaFromCoordinates, calculateCenterCoordinates } from './geocodingService';

const STORAGE_KEY = 'dva_submissions';

// Demo submitter names
const SUBMITTER_NAMES = [
  'Mario Rossi',
  'Luca Verdi',
  'Elena Bianchi',
  'Giovanni Romano',
  'Francesca Greco',
  'Alessandro Russo',
  'Chiara Conti',
  'Marco Ferrari'
];

/**
 * Get a random submitter name for demo purposes
 */
function getRandomSubmitterName(): string {
  return SUBMITTER_NAMES[Math.floor(Math.random() * SUBMITTER_NAMES.length)];
}

/**
 * Get all submissions from localStorage
 */
export function getSubmissions(): Submission[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load submissions:', error);
    return [];
  }
}

/**
 * Save submissions to localStorage
 */
function saveSubmissions(submissions: Submission[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  } catch (error) {
    console.error('Failed to save submissions:', error);
  }
}

/**
 * Convert a blob URL to base64 data URL
 */
async function blobUrlToBase64(blobUrl: string): Promise<string> {
  try {
    // If it's already a data URL or external URL, return as-is
    if (blobUrl.startsWith('data:') || !blobUrl.startsWith('blob:')) {
      return blobUrl;
    }

    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert blob to base64:', error);
    return blobUrl; // Return original URL as fallback
  }
}

/**
 * Get a single submission by ID
 */
export function getSubmissionById(id: string): Submission | undefined {
  const submissions = getSubmissions();
  return submissions.find(s => s.id === id);
}

/**
 * Create a new submission from pilot images
 * Converts blob URLs to base64 for persistence
 */
export async function createSubmission(images: DroneImage[], submitterName?: string): Promise<Submission> {
  const submissions = getSubmissions();
  
  // Convert all blob URLs to base64 for persistence
  const imagesWithBase64 = await Promise.all(
    images.map(async (img) => {
      const base64Url = await blobUrlToBase64(img.previewUrl);
      return {
        ...img,
        previewUrl: base64Url,
        reviewData: {
          status: 'pending_review' as const
        }
      };
    })
  );

  // Calculate center coordinates from all images
  const allCoordinates = images.map(img => img.metadata.coordinates);
  const centerCoords = calculateCenterCoordinates(allCoordinates);
  const area = getAreaFromCoordinates(centerCoords);

  const submission: Submission = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    submitterName: submitterName || getRandomSubmitterName(),
    submittedAt: new Date().toISOString(),
    images: imagesWithBase64,
    status: 'in_review',
    location: {
      area,
      coordinates: centerCoords
    }
  };

  submissions.unshift(submission); // Add to the beginning (newest first)
  saveSubmissions(submissions);
  
  return submission;
}

/**
 * Update submission data
 */
export function updateSubmission(id: string, updates: Partial<Submission>): Submission | undefined {
  const submissions = getSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  
  if (index === -1) return undefined;

  submissions[index] = { ...submissions[index], ...updates };
  saveSubmissions(submissions);
  
  return submissions[index];
}

/**
 * Recalculate submission status based on image review statuses
 */
export function updateSubmissionStatus(id: string): SubmissionStatus {
  const submissions = getSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  
  if (index === -1) return 'in_review';

  const submission = submissions[index];
  
  // Check if all images have been reviewed (not pending)
  const allReviewed = submission.images.every(
    img => img.reviewData?.status !== 'pending_review'
  );

  const newStatus: SubmissionStatus = allReviewed ? 'completed' : 'in_review';
  submissions[index].status = newStatus;
  saveSubmissions(submissions);
  
  return newStatus;
}

/**
 * Get submission statistics
 */
export function getSubmissionStats(submission: Submission): {
  total: number;
  pending: number;
  inAnalysis: number;
  worthy: number;
  inconclusive: number;
  discarded: number;
} {
  const stats = {
    total: submission.images.length,
    pending: 0,
    inAnalysis: 0,
    worthy: 0,
    inconclusive: 0,
    discarded: 0
  };

  for (const img of submission.images) {
    const status = img.reviewData?.status || 'pending_review';
    switch (status) {
      case 'pending_review':
        stats.pending++;
        break;
      case 'in_analysis':
        stats.inAnalysis++;
        break;
      case 'worthy_of_review':
        stats.worthy++;
        break;
      case 'inconclusive':
        stats.inconclusive++;
        break;
      case 'discarded':
        stats.discarded++;
        break;
    }
  }

  return stats;
}

/**
 * Delete a submission
 */
export function deleteSubmission(id: string): boolean {
  const submissions = getSubmissions();
  const filtered = submissions.filter(s => s.id !== id);
  
  if (filtered.length === submissions.length) return false;
  
  saveSubmissions(filtered);
  return true;
}

/**
 * Update AI analysis for a specific image in a submission
 */
export function updateImageAIAnalysis(
  submissionId: string, 
  imageId: string, 
  aiAnalysis: DroneImage['aiAnalysis']
): boolean {
  const submissions = getSubmissions();
  const submissionIndex = submissions.findIndex(s => s.id === submissionId);
  
  if (submissionIndex === -1) return false;
  
  const imageIndex = submissions[submissionIndex].images.findIndex(
    (img: DroneImage) => img.id === imageId
  );
  
  if (imageIndex === -1) return false;
  
  submissions[submissionIndex].images[imageIndex].aiAnalysis = aiAnalysis;
  saveSubmissions(submissions);
  
  return true;
}
