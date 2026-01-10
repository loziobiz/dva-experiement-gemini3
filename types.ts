export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AIAnalysisResult {
  confidence: number;
  description: string;
  features: string[];
  isAnalyzed: boolean;
}

// --- Archaeologist Section Types ---

export type ImageReviewStatus =
  | 'pending_review'       // In attesa di revisione
  | 'in_analysis'          // In analisi
  | 'worthy_of_review'     // Meritevole di approfondimento
  | 'inconclusive'         // Non conclusiva
  | 'discarded';           // Scartata

export type DiscardReason =
  | 'poor_quality'         // Qualità insufficiente
  | 'already_cataloged'    // Area già censita/nota
  | 'ai_false_positive'    // Falso positivo AI
  | 'not_archaeological'   // Natura non archeologica
  | 'insufficient_data';   // Dati insufficienti

export type SubmissionStatus =
  | 'in_review'            // In revisione
  | 'completed';           // Completato

export interface ImageReviewData {
  status: ImageReviewStatus;
  discardReason?: DiscardReason;
  discardComment?: string;
  reviewedAt?: string;     // ISO timestamp
  reviewedBy?: string;     // Nome archeologo (fake per demo)
}

export interface Submission {
  id: string;
  submitterName: string;
  submittedAt: string;     // ISO timestamp
  images: DroneImage[];    // Array di immagini con reviewData
  status: SubmissionStatus;
  location: {
    area: string;          // Area geografica (es. "Roma, Colosseo")
    coordinates: Coordinates; // Coordinate centrali (media)
  };
}

// --- Drone Image with Review Data ---

export interface DroneImage {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  metadata: {
    date: string;
    time: string;
    coordinates: Coordinates;
    altitude: number; // meters
    droneModel: string;
  };
  aiAnalysis?: AIAnalysisResult;
  reviewData?: ImageReviewData;
}

export interface EditorState {
  selectedImageIds: string[];
  images: DroneImage[];
}

// --- Status Labels and Colors ---

export const STATUS_LABELS: Record<ImageReviewStatus, string> = {
  pending_review: 'In attesa di revisione',
  in_analysis: 'In analisi',
  worthy_of_review: 'Meritevole di approfondimento',
  inconclusive: 'Non conclusiva',
  discarded: 'Scartata'
};

// Short labels for compact badges
export const STATUS_LABELS_SHORT: Record<ImageReviewStatus, string> = {
  pending_review: 'In attesa',
  in_analysis: 'Analisi',
  worthy_of_review: 'Meritevole',
  inconclusive: 'Inconclusiva',
  discarded: 'Scartata'
};

export const DISCARD_REASON_LABELS: Record<DiscardReason, string> = {
  poor_quality: 'Qualità insufficiente',
  already_cataloged: 'Area già censita/nota',
  ai_false_positive: 'Falso positivo AI',
  not_archaeological: 'Natura non archeologica',
  insufficient_data: 'Dati insufficienti'
};

export const STATUS_COLORS: Record<ImageReviewStatus, { border: string; bg: string }> = {
  pending_review: { border: 'border-slate-500', bg: 'bg-slate-500/20' },
  in_analysis: { border: 'border-amber-500', bg: 'bg-amber-500/20' },
  worthy_of_review: { border: 'border-emerald-500', bg: 'bg-emerald-500/20' },
  inconclusive: { border: 'border-blue-500', bg: 'bg-blue-500/20' },
  discarded: { border: 'border-red-500', bg: 'bg-red-500/20' }
};

