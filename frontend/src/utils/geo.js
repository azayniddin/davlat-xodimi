/**
 * Haversine masofa hisoblagich (Frontend)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Brauzerdan joriy GPS koordinatalarini olish
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Sizning qurilmangiz yoki brauzeringiz GPS geolokatsiyani qo\'llab-quvvatlamaydi'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy)
        });
      },
      (error) => {
        let msg = 'Joylashuvni aniqlab bo\'lmadi';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Joylashuvga (GPS) ruxsat berilmadi. Iltimos, brauzer sozlamalaridan geolokatsiyani yoqing.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'GPS signali mavjud emas yoki aniqlab bo\'lmadi.';
            break;
          case error.TIMEOUT:
            msg = 'Joylashuvni aniqlash vaqti tugadi. Qaytadan urinib ko\'ring.';
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}
