import { DroneImage } from '../types';

// EXIF is loaded globally via script tag in index.html
declare var EXIF: any;

// Helper to convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
const convertDMSToDD = (dms: number[], ref: string): number => {
  if (!dms || dms.length < 3) return 0;
  let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }
  return dd;
};

// Helper to parse EXIF date string "YYYY:MM:DD HH:MM:SS"
const parseExifDate = (dateTimeStr: string): string => {
  if (!dateTimeStr) return new Date().toISOString().split('T')[0];
  
  // EXIF format is typically "2024:07:24 14:32:15"
  const parts = dateTimeStr.split(' ');
  if (parts.length > 0) {
    const dateParts = parts[0].split(':');
    if (dateParts.length === 3) {
      return `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;
    }
  }
  return new Date().toISOString().split('T')[0];
};

export const extractExifMetadata = (file: File): Promise<DroneImage['metadata']> => {
  return new Promise((resolve) => {
    const defaultMetadata = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        coordinates: { lat: 0, lng: 0 },
        altitude: 0,
        droneModel: 'Sconosciuto'
    };

    // Add timeout to prevent hanging on missing/corrupt EXIF data
    const timeoutId = setTimeout(() => {
        console.warn(`EXIF extraction timeout for ${file.name} - using default values`);
        resolve(defaultMetadata);
    }, 3000); // 3 second timeout

    try {
        if (typeof EXIF === 'undefined') {
            console.warn('EXIF library not loaded');
            clearTimeout(timeoutId);
            resolve(defaultMetadata);
            return;
        }

        // We use 'any' for the library context as types might not be perfectly inferred
        EXIF.getData(file as any, function (this: any) {
        clearTimeout(timeoutId); // Clear timeout since we got a response

        const allTags = EXIF.getAllTags(this);

        // Default Values
        let lat = 0;
        let lng = 0;
        let date = new Date().toISOString().split('T')[0];
        let time = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        let altitude = 0;
        let droneModel = '';

        if (allTags) {
            // GPS
            if (allTags.GPSLatitude && allTags.GPSLatitudeRef) {
            lat = convertDMSToDD(allTags.GPSLatitude, allTags.GPSLatitudeRef);
            }
            if (allTags.GPSLongitude && allTags.GPSLongitudeRef) {
            lng = convertDMSToDD(allTags.GPSLongitude, allTags.GPSLongitudeRef);
            }
            if (allTags.GPSAltitude) {
                // Some cameras return a numerator/denominator object, others a number
                const alt = allTags.GPSAltitude;
                altitude = typeof alt === 'number' ? Math.round(alt) : Math.round(Number(alt));
                if (isNaN(altitude)) altitude = 0;
            }

            // Date & Time
            const dateTimeOriginal = allTags.DateTimeOriginal || allTags.DateTime;
            if (dateTimeOriginal) {
            date = parseExifDate(dateTimeOriginal);
            // Try to extract time "HH:MM:SS"
            const timePart = dateTimeOriginal.split(' ')[1];
            if (timePart) {
                const [h, m] = timePart.split(':');
                time = `${h}:${m}`;
            }
            }

            // Model
            const make = allTags.Make || '';
            const model = allTags.Model || '';
            if (make || model) {
                droneModel = `${make} ${model}`.trim();
            }
        }

        resolve({
            date,
            time,
            coordinates: { lat, lng },
            altitude,
            droneModel: droneModel || 'Sconosciuto'
        });
        });
    } catch (e) {
        clearTimeout(timeoutId);
        console.error("Error reading EXIF data", e);
        resolve(defaultMetadata);
    }
  });
};