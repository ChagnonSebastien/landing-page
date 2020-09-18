import FirestoreProvider from '../FirestoreProvider';
import { locationHistoryConverter } from '../models/LocationHistory';

export const getAllPoints = async (): Promise<string> => {
  const { firestore } = FirestoreProvider.get();
  const locationQuery = firestore.collection('locationHistory')
    .withConverter(locationHistoryConverter)
    .orderBy('timestamp')
    .limit(1);
  const locationSnapshot = await locationQuery.get();

  if (locationSnapshot.empty) {
    return undefined;
  }

  return locationSnapshot.docs[0].data().batteryState;
};

export default getAllPoints;
