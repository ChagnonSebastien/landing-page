import axios, { AxiosResponse } from "axios";
import { firestore } from 'firebase-admin';

export default async () => {
  const FirestoreInstance = firestore();
  const feedID = '0cabP8hB9XxqSSJ9QGNd160ahvZoVCeD3';
  let offset = 0;
  while (true) {
    const response: AxiosResponse = await axios.get(`https://api.findmespot.com/spot-main-web/consumer/rest-api/2.0/public/feed/${feedID}/message.json?start=${offset}`)
    if (response.data.response.errors) {
      console.log('Reached the end of the feed. Stopping.');
      return;
    }
    const messages = response.data.response.feedMessageResponse.messages.message;

    while (messages.length > 0) {
      const message = messages.shift();
      const formatedMessage: any = {
        timestamp: firestore.Timestamp.fromMillis(message.unixTime * 1000),
        location: new firestore.GeoPoint(message.latitude, message.longitude),
        messageType: message.messageType,
        messageContent: message.messageContent,
        batteryState: message.batteryState,
      }
      Object.keys(formatedMessage).forEach(key => formatedMessage[key] === undefined && delete formatedMessage[key]);
      const query = await FirestoreInstance.collection('locationHistory').where('timestamp', '==', formatedMessage.timestamp).limit(1).get();
      if(!query.empty) {
        console.log('Found duplicate entry. Stopping.');
        return;
      }

      FirestoreInstance.collection('locationHistory').doc().create(formatedMessage)
        .then((value: firestore.WriteResult) => {
          console.log('Successfully inserted document', formatedMessage, 'at', value.writeTime);
        })
        .catch((reason: any) => {
          console.error('Could not insert document', reason);
        });
    }

    offset += response.data.response.feedMessageResponse.count;
  }
}