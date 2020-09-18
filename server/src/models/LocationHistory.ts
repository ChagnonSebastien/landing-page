import {
  DocumentData, QueryDocumentSnapshot, GeoPoint, Timestamp,
} from '@google-cloud/firestore';

export class LocationHistory {
  constructor(
    readonly id: string,
    readonly batteryState: string,
    readonly elevation: number,
    readonly location: {
      latitude: number,
      longitude: number,
    },
    readonly messageType: string,
    readonly timestamp: Date,
  ) {}
}

export const locationHistoryConverter = {
  toFirestore(location: LocationHistory): DocumentData {
    return {
      batteryState: location.batteryState,
      elevation: location.elevation,
      location: new GeoPoint(location.location.latitude, location.location.longitude),
      messageType: location.messageType,
      timestamp: Timestamp.fromDate(location.timestamp),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): LocationHistory {
    const data = snapshot.data();
    const location = data.location as GeoPoint;
    const timestamp = data.timestamp as Timestamp;
    return new LocationHistory(
      snapshot.id,
      data.batteryState,
      data.elevation,
      { latitude: location.latitude, longitude: location.longitude },
      data.messageType,
      timestamp.toDate(),
    );
  },
};
