import { AIAnalysisResult } from "../types";

// Analizza l'immagine tramite il nostro API endpoint sicuro (server-side)
export const analyzeImage = async (base64Image: string, mimeType: string): Promise<AIAnalysisResult> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image,
        mimeType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Errore durante l\'analisi');
    }

    const result = await response.json();
    return result as AIAnalysisResult;

  } catch (error) {
    console.error("Errore analisi Gemini:", error);
    return {
      confidence: 0,
      description: "Errore durante l'analisi AI.",
      features: [],
      isAnalyzed: false,
    };
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
