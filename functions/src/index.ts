import * as functions from 'firebase-functions';
import blogMessagesExpress from './blogMessages';
import retrievePositionData from './retrievePositionData';

const admin = require('firebase-admin');
admin.initializeApp();

export const blogMessages = functions.https.onRequest(blogMessagesExpress);

export const version = functions.https.onRequest((_, response) => response.send("0.1"));

export const fetchLocations = functions.pubsub.schedule('*/5 06-21 * * *').onRun(retrievePositionData);