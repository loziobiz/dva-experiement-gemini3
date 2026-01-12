import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DroneImage, Coordinates, AIAnalysisResult } from './types';
import { analyzeImage, fileToBase64 } from './services/geminiService';
import { extractExifMetadata } from './services/exifService';
import { createSubmission } from './services/submissionService';
import ArchaeologistDashboard from './components/archaeologist/ArchaeologistDashboard';

declare var google: any;

declare global {
  interface Window {
    google: any;
  }
}

// --- Sub-components defined internally for simplicity of the single XML block structure ---

interface HeaderProps {
  currentUserView: 'home' | 'pilot' | 'archaeologist';
  onViewChange: (view: 'home' | 'pilot' | 'archaeologist') => void;
}

const Header: React.FC<HeaderProps> = ({ currentUserView, onViewChange }) => (
  <header className="border-b border-secondary bg-background/80 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <button 
        onClick={() => onViewChange('home')} 
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <img src="/logo/1000084000.webp" alt="DVA Logo" className="w-10 h-10 rounded-full object-cover" />
        <h1 className="text-xl font-bold tracking-tight text-white">DVA <span className="text-slate-400 font-normal text-sm ml-1 hidden sm:inline">| Drone Vision Archeology</span></h1>
      </button>
      <div className="flex items-center gap-4">
        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-surface border border-secondary rounded-lg p-1">
          <button
            onClick={() => onViewChange('pilot')}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${currentUserView === 'pilot' 
                ? 'bg-primary text-slate-900' 
                : 'text-slate-400 hover:text-white'}
            `}
          >
            <span className="material-symbols-outlined text-lg">flight</span>
            <span className="hidden sm:inline">Pilota</span>
          </button>
          <button
            onClick={() => onViewChange('archaeologist')}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${currentUserView === 'archaeologist' 
                ? 'bg-primary text-slate-900' 
                : 'text-slate-400 hover:text-white'}
            `}
          >
            <span className="material-symbols-outlined text-lg">search</span>
            <span className="hidden sm:inline">Archeologo</span>
          </button>
        </div>

        <button className="text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600"></div>
      </div>
    </div>
  </header>
);

// --- MAP COMPONENT ---

interface MapProps {
  coordinates: Coordinates;
  onCoordinatesChange: (coords: Coordinates) => void;
  searchAddress: string;
}

const MapComponent: React.FC<MapProps> = ({ coordinates, onCoordinatesChange, searchAddress }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const [map, setMap] = useState<any | null>(null);
  const [marker, setMarker] = useState<any | null>(null);

  // Map styles (extracted for readability)
  const mapStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ];

  // Initialize Map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const initialMap = new google.maps.Map(mapRef.current, {
        center: coordinates,
        zoom: 15,
        styles: mapStyles,
        mapTypeControl: false,
        streetViewControl: false,
      });

      const initialMarker = new google.maps.Marker({
        position: coordinates,
        map: initialMap,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });

      // Store refs for access in cleanup
      mapInstanceRef.current = initialMap;
      markerRef.current = initialMarker;

      setMap(initialMap);
      setMarker(initialMarker);

      // Cleanup function
      return () => {
        if (markerRef.current) {
          google.maps.event.clearInstanceListeners(markerRef.current);
          markerRef.current.setMap(null);
        }
        if (mapInstanceRef.current) {
          google.maps.event.clearInstanceListeners(mapInstanceRef.current);
        }
        mapInstanceRef.current = null;
        markerRef.current = null;
      };
    }
  }, []); // Empty deps - run only once

  // Update marker and map when coordinates change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getPosition();
      const diffLat = Math.abs((currentPos?.lat() || 0) - coordinates.lat);
      const diffLng = Math.abs((currentPos?.lng() || 0) - coordinates.lng);

      // Only update if difference is significant to prevent jitter/loops
      if (diffLat > 0.0001 || diffLng > 0.0001) {
        markerRef.current.setPosition(coordinates);
        mapInstanceRef.current.panTo(coordinates);
      }
    }
  }, [coordinates]);

  // Setup listeners when map and coordinates are available
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const currentMap = mapInstanceRef.current;
      const currentMarker = markerRef.current;

      // Remove any existing listeners first to avoid duplicates
      google.maps.event.clearListeners(currentMarker, 'dragend');
      google.maps.event.clearListeners(currentMap, 'click');

      // Marker drag end listener
      currentMarker.addListener('dragend', () => {
        const pos = currentMarker.getPosition();
        if (pos) {
          onCoordinatesChange({ lat: pos.lat(), lng: pos.lng() });
        }
      });

      // Map click listener - moves marker and updates coordinates
      currentMap.addListener('click', (e: any) => {
        if (e.latLng) {
          currentMarker.setPosition(e.latLng);
          currentMarker.setAnimation(google.maps.Animation.DROP);
          onCoordinatesChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        }
      });

      // Cleanup listeners on unmount or when dependencies change
      return () => {
        google.maps.event.clearListeners(currentMarker, 'dragend');
        google.maps.event.clearListeners(currentMap, 'click');
      };
    }
  }, [onCoordinatesChange]); // Re-attach when onCoordinatesChange changes

  // Sync local state with refs
  useEffect(() => {
    setMap(mapInstanceRef.current);
    setMarker(markerRef.current);
  }, []);

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
};


// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [currentUserView, setCurrentUserView] = useState<'home' | 'pilot' | 'archaeologist'>('home');
  const [view, setView] = useState<'upload' | 'editor' | 'success'>('upload');
  const [images, setImages] = useState<DroneImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [searchAddress, setSearchAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const autoCompleteRef = useRef<HTMLInputElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dva_images');
    if (saved) {
      try {
        const parsedImages = JSON.parse(saved);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            setImages(parsedImages);
            setView('editor');
            // Optionally select the first image to show details immediately
            setSelectedImageIds([parsedImages[0].id]);
        }
      } catch (error) {
        console.error("Failed to restore images from local storage:", error);
      }
    }
  }, []);

  // Auto-save images to localStorage whenever they change
  useEffect(() => {
    if (images.length > 0) {
      localStorage.setItem('dva_images', JSON.stringify(images));
    }
  }, [images]);

  // Initialize Autocomplete
  useEffect(() => {
    if (view === 'editor' && autoCompleteRef.current && window.google) {
      const autocomplete = new google.maps.places.Autocomplete(autoCompleteRef.current);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const newCoords = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          updateSelectedCoordinates(newCoords);
        }
      });
    }
  }, [view, selectedImageIds]);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setIsUploading(true);

      try {
        // Explicitly type files as File[] to resolve inference errors
        const files: File[] = Array.from(e.target.files);

        // Process files concurrently to extract metadata
        const newImagesPromises = files.map(async (file) => {
          const metadata = await extractExifMetadata(file);
          return {
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
            metadata,
          } as DroneImage;
        });

        const newImages = await Promise.all(newImagesPromises);

        setImages(prev => [...prev, ...newImages]);

        // If we are in upload view, switch to editor immediately after upload
        if (view === 'upload') {
          setView('editor');
          // Auto select the first one
          if (newImages.length > 0) {
              setSelectedImageIds([newImages[0].id]);
          }
        }
      } catch (error) {
        console.error('Error uploading images:', error);
        alert('Errore durante il caricamento delle immagini. Riprova.');
      } finally {
        setIsUploading(false);
        // Reset the input value to allow re-uploading the same file
        e.target.value = '';
      }
    }
  };

  const toggleSelection = (id: string, multi: boolean) => {
    if (multi) {
      setSelectedImageIds(prev => 
        prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
      );
    } else {
      setSelectedImageIds([id]);
    }
  };

  const updateMetadata = (key: keyof DroneImage['metadata'], value: any) => {
    setImages(prev => prev.map(img => {
      if (selectedImageIds.includes(img.id)) {
        return {
          ...img,
          metadata: {
            ...img.metadata,
            [key]: value
          }
        };
      }
      return img;
    }));
  };

  const updateSelectedCoordinates = (coords: Coordinates) => {
    setImages(prev => prev.map(img => {
      if (selectedImageIds.includes(img.id)) {
        return {
          ...img,
          metadata: {
            ...img.metadata,
            coordinates: coords
          }
        };
      }
      return img;
    }));
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    const imagesToAnalyze = images.filter(img => selectedImageIds.includes(img.id));

    // Process sequentially (or parallel limited)
    const updatedImages = [...images];

    for (const img of imagesToAnalyze) {
      // Simulate loading state for this image if we had granular UI
      try {
        const base64 = await fileToBase64(img.file);
        const result = await analyzeImage(base64, img.file.type);
        
        // Update local state array
        const index = updatedImages.findIndex(i => i.id === img.id);
        if (index !== -1) {
          updatedImages[index] = { ...updatedImages[index], aiAnalysis: result };
        }
      } catch (e) {
        console.error("Failed to analyze", img.id, e);
      }
    }

    setImages(updatedImages);
    setIsAnalyzing(false);
  };

  const handleSubmit = async () => {
    // Create a submission for the archaeologist to review
    // This converts blob URLs to base64 for persistence
    await createSubmission(images);
    // Clear local storage for pilot
    localStorage.removeItem('dva_images');
    setView('success');
  };

  const handleReset = () => {
    setImages([]);
    setSelectedImageIds([]);
    setSearchAddress('');
    setIsAnalyzing(false);
    setView('upload');
    // Clear storage on reset/start over
    localStorage.removeItem('dva_images');
  };

  const handleDeleteImage = (id: string) => {
    // Remove the image from the list
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id);
      // If no images left, go back to upload view
      if (newImages.length === 0) {
        setView('upload');
        localStorage.removeItem('dva_images');
      }
      return newImages;
    });

    // Remove from selection if it was selected
    setSelectedImageIds(prev => {
      const newSelection = prev.filter(imgId => imgId !== id);
      // If the deleted image was selected and there are still images, select the first one
      if (prev.includes(id) && newSelection.length === 0) {
        const remainingImages = images.filter(img => img.id !== id);
        if (remainingImages.length > 0) {
          return [remainingImages[0].id];
        }
      }
      return newSelection;
    });
  };

  // Validation Logic
  const areAllImagesValid = images.length > 0 && images.every(img => 
    img.metadata.coordinates.lat !== 0 && 
    img.metadata.coordinates.lng !== 0
  );

  // Derived state for the editor form
  const selectedImages = images.filter(img => selectedImageIds.includes(img.id));
  const primarySelection = selectedImages[0];
  
  // Determine form values (if multiple selected, show value only if all match, else empty/mixed)
  const getCommonValue = <K extends keyof DroneImage['metadata']>(key: K): string | number => {
    if (selectedImages.length === 0) return '';
    const firstVal = selectedImages[0].metadata[key];
    const allMatch = selectedImages.every(img => img.metadata[key] === firstVal);
    // @ts-ignore
    return allMatch ? firstVal : '';
  };
  
  const getCommonCoordinate = (key: keyof Coordinates): number | string => {
    if (selectedImages.length === 0) return '';
    const firstVal = selectedImages[0].metadata.coordinates[key];
    const allMatch = selectedImages.every(img => img.metadata.coordinates[key] === firstVal);
    return allMatch ? firstVal : '';
  };

  return (
    <div className="min-h-screen bg-background text-slate-200 font-sans selection:bg-primary selection:text-white">
      <Header currentUserView={currentUserView} onViewChange={setCurrentUserView} />

      {/* Home View - Role Selection */}
      {currentUserView === 'home' && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center">
          <div className="text-center mb-12 animate-fade-in">
            <img 
              src="/logo/1000084000.webp" 
              alt="DVA Logo" 
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.3)] border-2 border-primary/30" 
            />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Benvenuto su DVA</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Scegli il tuo ruolo per accedere alla piattaforma di analisi archeologica con droni.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full animate-fade-in" style={{ animationDelay: '150ms' }}>
            {/* Pilot Card */}
            <button
              onClick={() => setCurrentUserView('pilot')}
              className="group relative bg-surface border border-secondary rounded-2xl p-8 text-left hover:border-primary transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl text-primary">flight</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Pilota</h3>
                <p className="text-slate-400 leading-relaxed">
                  Carica le tue immagini aeree, gestisci i metadati GPS e contribuisci alla ricerca archeologica.
                </p>
                <div className="mt-6 flex items-center gap-2 text-primary font-semibold">
                  <span>Inizia a caricare</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            </button>

            {/* Archaeologist Card */}
            <button
              onClick={() => setCurrentUserView('archaeologist')}
              className="group relative bg-surface border border-secondary rounded-2xl p-8 text-left hover:border-accent transition-all duration-300 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl text-accent">search</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Archeologo</h3>
                <p className="text-slate-400 leading-relaxed">
                  Revisiona le segnalazioni, analizza i dati e gestisci i progetti di ricerca archeologica.
                </p>
                <div className="mt-6 flex items-center gap-2 text-accent font-semibold">
                  <span>Vai alla dashboard</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            </button>
          </div>
        </main>
      )}

      {/* Archaeologist View */}
      {currentUserView === 'archaeologist' && (
        <ArchaeologistDashboard />
      )}

      {/* Pilot View */}
      {currentUserView === 'pilot' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-auto">
        
        {view === 'upload' && (
          <div className="flex flex-col items-center justify-center animate-fade-in gap-10 py-8 min-h-[calc(100vh-128px)]">
            <div className="w-full max-w-2xl bg-surface border-2 border-dashed border-secondary rounded-2xl p-12 text-center hover:border-primary transition-colors duration-300 relative group shrink-0">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-background/95 rounded-2xl flex flex-col items-center justify-center gap-4 z-20">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white font-bold">Caricamento immagini in corso...</p>
                  <p className="text-slate-400 text-sm">Estrazione metadati EXIF</p>
                </div>
              )}
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                  <span className="material-symbols-outlined text-5xl">cloud_upload</span>
                </div>
                <h2 className="text-3xl font-bold text-white">Carica le tue immagini</h2>
                <p className="text-slate-400 max-w-md">
                  Trascina qui le foto scattate dal tuo drone o clicca per selezionarle.
                  Accettiamo JPG, PNG e TIFF.
                </p>
                <button
                  disabled={isUploading}
                  className="mt-6 px-6 py-3 bg-primary text-slate-900 font-bold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Seleziona File
                </button>
              </div>
            </div>

            <div className="w-full max-w-5xl shrink-0">
               <h3 className="text-xl font-bold text-white mb-6 text-center">Come funziona</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1 */}
                  <div className="flex flex-col items-center text-center gap-4 p-6 bg-surface/50 rounded-xl border border-secondary/50 hover:bg-surface transition-colors">
                     <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                     </div>
                     <div>
                        <p className="font-bold text-white mb-1">1. Seleziona</p>
                        <p className="text-sm text-slate-400">Scegli le immagini dal tuo dispositivo o trascinale direttamente nell'area di caricamento.</p>
                     </div>
                  </div>
                  
                  {/* Card 2 */}
                  <div className="flex flex-col items-center text-center gap-4 p-6 bg-surface/50 rounded-xl border border-secondary/50 hover:bg-surface transition-colors">
                     <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                     </div>
                     <div>
                        <p className="font-bold text-white mb-1">2. Carica</p>
                        <p className="text-sm text-slate-400">Carica i file. Il sistema leggerà automaticamente i metadati GPS e EXIF.</p>
                     </div>
                  </div>

                  {/* Card 3 */}
                  <div className="flex flex-col items-center text-center gap-4 p-6 bg-surface/50 rounded-xl border border-secondary/50 hover:bg-surface transition-colors">
                     <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">analytics</span>
                     </div>
                     <div>
                        <p className="font-bold text-white mb-1">3. Analizza</p>
                        <p className="text-sm text-slate-400">L'IA analizzerà le immagini per identificare potenziali siti archeologici e anomalie.</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {view === 'success' && (
          <div className="flex flex-col items-center justify-center animate-fade-in text-center min-h-[calc(100vh-128px)]">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 text-primary border border-primary/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <span className="material-symbols-outlined text-6xl font-bold">check</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Grazie per il tuo contributo!</h2>
            <p className="text-slate-400 text-lg max-w-lg mb-10 leading-relaxed">
              Le tue immagini sono state inviate con successo e saranno revisionate dal nostro team di archeologi per identificare nuovi siti di interesse.
            </p>
            <button 
              onClick={handleReset}
              className="px-8 py-4 bg-primary text-slate-900 font-bold text-lg rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-2 shadow-lg hover:shadow-primary/20"
            >
              <span className="material-symbols-outlined">add_photo_alternate</span>
              Carica altre immagini
            </button>
          </div>
        )}

        {view === 'editor' && (
          <div className="flex flex-col gap-6">

            {/* Reset Button */}
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30 hover:border-red-600 transition-all flex items-center gap-2 text-sm font-bold"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                Cancella tutto e ricomincia
              </button>
            </div>

            {/* Top: Image Grid */}
            <div className="h-48 shrink-0 bg-surface border border-secondary rounded-xl p-4 overflow-x-auto overflow-y-hidden">
               <div className="flex gap-4 h-full">
                  {/* Upload More Button */}
                  <div className="w-40 shrink-0 h-full border-2 border-dashed border-secondary rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-primary hover:border-primary cursor-pointer relative transition-colors">
                     <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                     <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                     <span className="text-xs font-bold mt-2">Aggiungi</span>
                  </div>

                  {images.map(img => (
                    <div
                      key={img.id}
                      onClick={(e) => toggleSelection(img.id, e.metaKey || e.ctrlKey)}
                      className={`
                        w-64 shrink-0 h-full relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all group
                        ${selectedImageIds.includes(img.id) ? 'border-primary shadow-[0_0_0_4px_rgba(16,185,129,0.2)]' : 'border-transparent hover:border-slate-500'}
                      `}
                    >
                      <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100"></div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs font-bold text-white truncate">{img.name}</p>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-slate-300 bg-black/40 px-1.5 py-0.5 rounded">
                                {img.metadata.date}
                            </span>
                             {img.aiAnalysis?.isAnalyzed && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${img.aiAnalysis.confidence > 70 ? 'bg-primary text-slate-900' : 'bg-slate-600 text-slate-200'}`}>
                                    AI: {Math.round(img.aiAnalysis.confidence)}%
                                </span>
                             )}
                        </div>
                      </div>
                      {/* Checkmark overlay */}
                      {selectedImageIds.includes(img.id) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-slate-900">
                           <span className="material-symbols-outlined text-sm font-bold">check</span>
                        </div>
                      )}
                      {/* Delete button - visible on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(img.id);
                        }}
                        className="absolute top-2 left-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="Scarta immagine"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  ))}
               </div>
            </div>

            {/* Middle: Main Action Button */}
            <div className="shrink-0">
                <button 
                  onClick={handleSubmit}
                  disabled={!areAllImagesValid}
                  className={`
                    w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg
                    ${areAllImagesValid 
                      ? 'bg-primary text-slate-900 hover:bg-emerald-400 hover:shadow-primary/20' 
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'}
                  `}
                >
                  <span className="material-symbols-outlined">send</span>
                  Invia per Revisione {images.length > 0 && `(${images.length})`}
                </button>
                {!areAllImagesValid && (
                    <p className="text-center text-xs text-red-400 mt-2">
                        * Assicurati che tutte le immagini abbiano coordinate geografiche valide prima di inviare.
                    </p>
                )}
            </div>

            {/* Bottom: Split View (Metadata & Map) */}
            <div className="flex-1 min-h-0 flex gap-6 items-stretch">
              
              {/* Left Panel: Metadata Form & AI */}
              <div className="w-1/3 bg-surface border border-secondary rounded-xl p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">edit_document</span>
                        Metadati
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                        {selectedImageIds.length} Selezionati
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Latitudine</label>
                        <input 
                            type="number" 
                            step="any"
                            className="w-full bg-background border border-secondary rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                            value={String(getCommonCoordinate('lat'))}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const lng = parseFloat(String(getCommonCoordinate('lng')) || '0');
                                if(!isNaN(val)) updateSelectedCoordinates({ lat: val, lng });
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Longitudine</label>
                        <input 
                            type="number" 
                            step="any"
                            className="w-full bg-background border border-secondary rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                            value={String(getCommonCoordinate('lng'))}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const lat = parseFloat(String(getCommonCoordinate('lat')) || '0');
                                if(!isNaN(val)) updateSelectedCoordinates({ lat, lng: val });
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Altitudine (m)</label>
                        <input 
                            type="number" 
                            className="w-full bg-background border border-secondary rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                            value={String(getCommonValue('altitude'))}
                            onChange={(e) => updateMetadata('altitude', Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Data</label>
                        <input 
                            type="date" 
                            className="w-full bg-background border border-secondary rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                            value={String(getCommonValue('date'))}
                            onChange={(e) => updateMetadata('date', e.target.value)}
                        />
                    </div>
                    
                    <div className="space-y-1 col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Modello Drone</label>
                        <input 
                            type="text" 
                            className="w-full bg-background border border-secondary rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                            value={String(getCommonValue('droneModel'))}
                            onChange={(e) => updateMetadata('droneModel', e.target.value)}
                            placeholder="Es. DJI Mavic 3"
                        />
                    </div>
                </div>

                <div className="border-t border-secondary my-2"></div>

                {/* AI Section */}
                <div>
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent">auto_awesome</span>
                            Analisi AI
                        </h3>
                        <button 
                            onClick={runAIAnalysis}
                            disabled={isAnalyzing || selectedImageIds.length === 0}
                            className={`
                                text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all
                                ${isAnalyzing ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-accent/20 text-accent hover:bg-accent hover:text-slate-900'}
                            `}
                        >
                            {isAnalyzing ? (
                                <><span className="material-symbols-outlined text-sm animate-spin">sync</span> Analisi...</>
                            ) : (
                                <><span className="material-symbols-outlined text-sm">play_arrow</span> Avvia Analisi</>
                            )}
                        </button>
                     </div>

                     {/* AI Results Display */}
                     {primarySelection?.aiAnalysis?.isAnalyzed ? (
                         <div className="bg-background/50 rounded-lg p-4 border border-secondary">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400">PUNTEGGIO FIDUCIA</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${primarySelection.aiAnalysis.confidence > 70 ? 'bg-green-500' : primarySelection.aiAnalysis.confidence > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                            style={{ width: `${primarySelection.aiAnalysis.confidence}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-mono">{primarySelection.aiAnalysis.confidence}%</span>
                                </div>
                            </div>
                            
                            <p className="text-sm text-slate-300 mb-3 italic">"{primarySelection.aiAnalysis.description}"</p>
                            
                            <div className="flex flex-wrap gap-2">
                                {primarySelection.aiAnalysis.features.map((feature, idx) => (
                                    <span key={idx} className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-600">
                                        {feature}
                                    </span>
                                ))}
                            </div>
                         </div>
                     ) : (
                         <div className="text-center py-6 text-slate-500 bg-background/30 rounded-lg border border-secondary border-dashed">
                             <span className="material-symbols-outlined text-3xl mb-2 opacity-50">smart_toy</span>
                             <p className="text-xs">Avvia l'analisi per identificare<br/>potenziali siti di scavo.</p>
                         </div>
                     )}
                </div>
              </div>

              {/* Right Panel: Map */}
              <div className="w-2/3 bg-surface border border-secondary rounded-xl overflow-hidden relative flex flex-col min-h-[700px]">
                <div className="absolute top-4 left-4 right-4 z-10">
                    <div className="relative shadow-xl">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400">search</span>
                        </div>
                        <input
                            ref={autoCompleteRef}
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 bg-surface border border-secondary rounded-lg leading-5 text-slate-200 placeholder-slate-400 focus:outline-none focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                            placeholder="Cerca un luogo (es. Colosseo, Roma)..."
                            value={searchAddress}
                            onChange={(e) => setSearchAddress(e.target.value)}
                        />
                    </div>
                </div>
                
                {primarySelection ? (
                    <MapComponent 
                        coordinates={primarySelection.metadata.coordinates}
                        onCoordinatesChange={updateSelectedCoordinates}
                        searchAddress={searchAddress}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        <p>Seleziona un'immagine per visualizzare la mappa</p>
                    </div>
                )}
                
                {/* Lat/Lng display overlay */}
                {primarySelection && (
                    <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur border border-secondary px-3 py-2 rounded-lg text-xs font-mono shadow-lg">
                        <div className="flex gap-4">
                            <span>LAT: {primarySelection.metadata.coordinates.lat.toFixed(6)}</span>
                            <span>LNG: {primarySelection.metadata.coordinates.lng.toFixed(6)}</span>
                        </div>
                    </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
      )}
    </div>
  );
};

export default App;