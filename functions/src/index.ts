import * as functions from 'firebase-functions';
import retrievePositionData from './retrievePositionData';

const admin = require('firebase-admin');
admin.initializeApp();

export const fetchLocations = functions.pubsub.schedule('*/5 06-21 * * *').timeZone('America/Montreal').onRun(retrievePositionData);