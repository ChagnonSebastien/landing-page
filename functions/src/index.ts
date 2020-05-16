import * as functions from 'firebase-functions';
import blogMessagesExpress from './blogMessages';

export const blogMessages = functions.https.onRequest(blogMessagesExpress);

export const version = functions.https.onRequest((_, response) => {
  response.send("0.1");
});