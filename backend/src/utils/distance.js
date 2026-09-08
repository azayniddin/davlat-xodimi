/**
 * Haversine formulasi yordamida ikkita koordinata orasidagi masofani (metrlarda) hisoblash.
 * @param {number} lat1 - 1-nuqta kengligi
 * @param {number} lon1 - 1-nuqta uzunligi
 * @param {number} lat2 - 2-nuqta kengligi
 * @param {number} lon2 - 2-nuqta uzunligi
 * @returns {number} Masofa (metrlarda)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Yer radiusi metrlarda
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Metrlarda yaxlitlangan masofa
}
