import * as functions from 'firebase-functions';
import retrievePositionData from './retrievePositionData';

const admin = require('firebase-admin');
admin.initializeApp();

export const fetchLocations = functions.pubsub
  .schedule('*/10 * * * *')
  .timeZone('America/Montreal')
  .onRun(retrievePositionData);
