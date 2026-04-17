export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Number(d.toFixed(2));
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function isWithinRadius(
  userLat: number, userLng: number,
  targetLat: number, targetLng: number,
  radiusKm: number = 5
): boolean {
  return haversineKm(userLat, userLng, targetLat, targetLng) <= radiusKm;
}

export function sortByDistance<T extends { lat: number | null | string; lng: number | null | string }>(
  items: T[],
  userLat: number,
  userLng: number
): (T & { distanceKm: number })[] {
  return items
    .filter(i => i.lat !== null && i.lng !== null)
    .map(i => ({
      ...i,
      distanceKm: Math.round(haversineKm(
        userLat, userLng,
        Number(i.lat!), Number(i.lng!)
      ) * 10) / 10
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
