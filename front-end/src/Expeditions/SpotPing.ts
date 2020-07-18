export default class SpotPing {
  constructor(
    public batteryState: string,
    public elevation: number,
    public location: {
      latitude: number,
      longitude: number,
    },
    public messageContent: string,
    public messageType: string,
    public timestamp: number,
  ) {}

  public distanceTo(otherPing: SpotPing) {
    const p = 0.017453292519943295;    // Math.PI / 180
    const c = Math.cos;
    const a = 0.5 - c((otherPing.location.latitude - this.location.latitude) * p)/2 + 
            c(this.location.latitude * p) * c(otherPing.location.latitude * p) * 
            (1 - c((otherPing.location.longitude - this.location.longitude) * p))/2;
  
    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  }
};
