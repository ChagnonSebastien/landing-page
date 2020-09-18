import { Timestamp } from '@google-cloud/firestore';

import FirestoreProvider from '../FirestoreProvider';
import { Expedition } from '../models/Expedition';
import { LocationHistory, locationHistoryConverter } from '../models/LocationHistory';
import convertISOToDate from '../utils';

export class DateOutOfBounds extends Error {
  constructor() {
    super('The expedition was not active at the required date');
  }
}

export const getLatestPoint = async (expedition: Expedition): Promise<LocationHistory> => {
  const { firestore } = FirestoreProvider.get();
  const { from, to } = expedition.getDateBounds(true);

  const searchQuery = firestore.collection('locationHistory')
    .withConverter(locationHistoryConverter)
    .orderBy('timestamp', 'desc')
    .limit(1)
    .where('timestamp', '>', Timestamp.fromDate(from))
    .where('timestamp', '<', Timestamp.fromDate(to));

  const locationQuery = await searchQuery.get();
  if (locationQuery.empty) {
    return undefined;
  }

  return locationQuery.docs[0].data();
};

export const getAllPoints = async (
  expedition: Expedition,
  date: string,
): Promise<LocationHistory[]> => {
  const { firestore } = FirestoreProvider.get();
  const { from, to } = expedition.getDateBounds(false);

  let searchQuery = firestore.collection('locationHistory')
    .withConverter(locationHistoryConverter)
    .orderBy('timestamp', 'asc');

  if (date) {
    const reqDateStart = convertISOToDate(date, expedition.timezone);
    const travelBounds = expedition.getDateBounds(true);

    if (
      travelBounds.from.getTime() > reqDateStart.getTime()
        || travelBounds.to.getTime() < reqDateStart.getTime()
    ) {
      throw new DateOutOfBounds();
    }

    const reqDateEnd = new Date(reqDateStart);
    reqDateEnd.setDate(reqDateStart.getDate() + 1);
    searchQuery = searchQuery
      .where('timestamp', '>', Timestamp.fromDate(reqDateStart))
      .where('timestamp', '<', Timestamp.fromDate(reqDateEnd));
  } else {
    searchQuery = searchQuery
      .where('timestamp', '>', Timestamp.fromDate(from))
      .where('timestamp', '<', Timestamp.fromDate(to))
      .where('messageType', '==', 'OK');
  }

  const locationQuery = await searchQuery.get();
  return locationQuery.docs.map((docSnapshot) => docSnapshot.data());
};
