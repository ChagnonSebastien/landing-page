export default interface SpotPing {
  batteryState: string,
  elevation: number,
  location: {
    latitude: number,
    longitude: number,
  },
  messageContent: string,
  messageType: string,
  timestamp: number,
};

export const distanceBetweenGeoPoints = (ping1: SpotPing, ping2: SpotPing) => {
  const p = 0.017453292519943295;    // Math.PI / 180
  const c = Math.cos;
  const a = 0.5 - c((ping1.location.latitude - ping2.location.latitude) * p)/2 + 
          c(ping2.location.latitude * p) * c(ping1.location.latitude * p) * 
          (1 - c((ping1.location.longitude - ping2.location.longitude) * p))/2;

  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}