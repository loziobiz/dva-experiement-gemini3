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
}

export interface EditorState {
  selectedImageIds: string[];
  images: DroneImage[];
}
