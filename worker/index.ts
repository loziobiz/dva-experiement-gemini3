// Cloudflare Worker entry point
import { GoogleGenAI, Type } from "@google/genai";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API endpoint per l'analisi Gemini
    if (url.pathname === '/api/analyze' && request.method === 'POST') {
      try {
        if (!env.GEMINI_API_KEY) {
          return new Response(
            JSON.stringify({ error: 'GEMINI_API_KEY non configurata' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const body = await request.json() as { base64Image: string; mimeType: string };
        const { base64Image, mimeType } = body;

        if (!base64Image || !mimeType) {
          return new Response(
            JSON.stringify({ error: 'Parametri mancanti: base64Image e mimeType richiesti' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Inizializza Gemini con la API key dal secret
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

        const prompt = `
          Sei un esperto archeologo specializzato in fotografia aerea e telerilevamento.
          Analizza questa immagine scattata da un drone.
          Il tuo obiettivo è identificare possibili siti archeologici, cropmarks (segni nelle colture), 
          variazioni del terreno o rovine strutturali.
          
          Restituisci i risultati in formato JSON con i seguenti campi:
          - confidence: un numero da 0 a 100 che indica la probabilità che ci sia qualcosa di interesse archeologico.
          - description: una breve descrizione tecnica in italiano di ciò che vedi (max 2 frasi).
          - features: una lista di stringhe (max 3) delle caratteristiche rilevate (es. "Muro perimetrale", "Variazione cromatica", "Fondamenta").
        `;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image,
                },
              },
              {
                text: prompt,
              },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                confidence: { type: Type.NUMBER },
                description: { type: Type.STRING },
                features: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
              },
              required: ["confidence", "description", "features"],
            },
          },
        });

        const resultText = response.text;
        if (!resultText) {
          throw new Error("Nessuna risposta dal modello.");
        }

        const jsonResult = JSON.parse(resultText);

        return new Response(
          JSON.stringify({
            confidence: jsonResult.confidence || 0,
            description: jsonResult.description || "Nessuna caratteristica rilevante identificata.",
            features: jsonResult.features || [],
            isAnalyzed: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error("Errore analisi Gemini:", error);
        return new Response(
          JSON.stringify({
            confidence: 0,
            description: "Errore durante l'analisi AI.",
            features: [],
            isAnalyzed: false,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Per tutte le altre richieste, Cloudflare serve gli asset statici
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
} satisfies ExportedHandler<Env>;

// Environment bindings type
interface Env {
  GEMINI_API_KEY: string;
}
