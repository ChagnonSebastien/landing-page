import axios from "axios";
import { firestore } from 'firebase-admin';
import { Client, ElevationResponse } from "@googlemaps/google-maps-services-js";
import { config } from 'firebase-functions';

type SpotResponse = {
  response: {
    feedMessageResponse: {
      count: number,
      messages: {
        message: Array<{
          latitude: number,
          longitude: number,
          unixTime: number,
          messageType: string,
          messageContent: string,
          batteryState: string,
        }>,
      },
    },
    errors: Array<{}>,
  },
}

export default async () => {
  const client = new Client({});
  const FirestoreInstance = firestore();
  const feedID = '0cabP8hB9XxqSSJ9QGNd160ahvZoVCeD3';
  let offset = 0;
  while (true) {
    const url = `https://api.findmespot.com/spot-main-web/consumer/rest-api/2.0/public/feed/${feedID}/message.json?start=${offset}`;
    const response = await axios.get<SpotResponse>(url)
    if (response.data.response.errors) {
      console.log('Reached the end of the feed. Stopping.');
      return;
    }
    const messages = response.data.response.feedMessageResponse.messages.message;

    while (messages.length > 0) {
      const message = messages.shift();
      if (!message) throw new Error('No more items in the queue');

      const query = await FirestoreInstance.collection('locationHistory').where('timestamp', '==', firestore.Timestamp.fromMillis(message.unixTime * 1000)).limit(1).get();
      if(!query.empty) {
        console.log('Found duplicate entry. Stopping.');
        return;
      }

      const elevationResponse: ElevationResponse = await client.elevation({
        params: {
          locations: [{ lat: message.latitude, lng: message.longitude }],
          key: config().maps.key,
        },
        timeout: 1000,
      });
      
      const formatedMessage: any = {
        timestamp: firestore.Timestamp.fromMillis(message.unixTime * 1000),
        location: new firestore.GeoPoint(message.latitude, message.longitude),
        messageType: message.messageType,
        messageContent: message.messageContent,
        batteryState: message.batteryState,
        elevation: elevationResponse.data.results[0].elevation,
      }
      Object.keys(formatedMessage).forEach(key => formatedMessage[key] === undefined && delete formatedMessage[key]);

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
