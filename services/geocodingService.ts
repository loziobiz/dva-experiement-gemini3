import { Coordinates } from '../types';

// Mock Italian cities for demo reverse geocoding
const ITALIAN_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'Roma, Colosseo', lat: 41.8902, lng: 12.4924 },
  { name: 'Roma, Foro Romano', lat: 41.8925, lng: 12.4853 },
  { name: 'Pompei, Area Archeologica', lat: 40.7508, lng: 14.4869 },
  { name: 'Napoli, Centro Storico', lat: 40.8518, lng: 14.2681 },
  { name: 'Firenze, Centro', lat: 43.7696, lng: 11.2558 },
  { name: 'Milano, Duomo', lat: 45.4642, lng: 9.1900 },
  { name: 'Torino, Centro', lat: 45.0703, lng: 7.6869 },
  { name: 'Bologna, Centro', lat: 44.4949, lng: 11.3426 },
  { name: 'Venezia, San Marco', lat: 45.4343, lng: 12.3388 },
  { name: 'Palermo, Centro', lat: 38.1157, lng: 13.3615 },
  { name: 'Siracusa, Ortigia', lat: 37.0629, lng: 15.2929 },
  { name: 'Agrigento, Valle dei Templi', lat: 37.2914, lng: 13.5893 },
  { name: 'Tarquinia, Necropoli', lat: 42.2531, lng: 11.7752 },
  { name: 'Ostia Antica', lat: 41.7556, lng: 12.2889 },
  { name: 'Paestum, Templi', lat: 40.4207, lng: 15.0053 },
];

/**
 * Calculate the distance between two coordinates using Haversine formula
 */
function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get area name from coordinates (demo: finds nearest known city)
 */
export function getAreaFromCoordinates(coords: Coordinates): string {
  let nearestCity = ITALIAN_CITIES[0];
  let minDistance = haversineDistance(coords, { lat: nearestCity.lat, lng: nearestCity.lng });

  for (const city of ITALIAN_CITIES) {
    const distance = haversineDistance(coords, { lat: city.lat, lng: city.lng });
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }

  // If distance > 50km, return a generic area name
  if (minDistance > 50) {
    return `Area ${coords.lat.toFixed(2)}°N, ${coords.lng.toFixed(2)}°E`;
  }

  return nearestCity.name;
}

/**
 * Calculate the center coordinates from an array of images
 */
export function calculateCenterCoordinates(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length,
  };
}
