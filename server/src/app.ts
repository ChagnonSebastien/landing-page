import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import { validationResult, query } from 'express-validator';
import { findTimeZone, getUnixTime } from 'timezone-support';
import { locationHistoryConverter } from './LocationHistory';
import { expeditionConverter } from './Expedition';

const app = express();

const firestore: Firestore = new Firestore();

app.use(cors());
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method}:${req.url}`);
  next();
});

app.get('/version', (_, res) => res.send('v1.0.0'));

app.get('/spot/batteryState', async (_, res) => {
  try {
    const locationQuery = firestore.collection('locationHistory')
      .withConverter(locationHistoryConverter)
      .orderBy('timestamp')
      .limit(1);
    const locationSnapshot = await locationQuery.get();

    if (locationSnapshot.empty) {
      return res.status(404).send('No battery state has ever been recorded.');
    }

    return res.send(locationSnapshot.docs[0].data().batteryState);
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
});

app.get('/expeditions', async (_, res) => {
  try {
    const expeditionsQuery = firestore.collection('expeditions')
      .withConverter(expeditionConverter);
    const expeditionsSnapshot = await expeditionsQuery.get();

    return res.send(expeditionsSnapshot.docs.map((docSnapshot) => docSnapshot.data()));
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
});

app.get('/expeditions/:expeditionId', async (req, res) => {
  try {
    const expeditionsQuery = firestore.collection('expeditions')
      .withConverter(expeditionConverter)
      .doc(req.params.expeditionId);
    const expeditionSnapshot = await expeditionsQuery.get();

    if (!expeditionSnapshot.exists) {
      return res.status(404).send('Expedition does not exist.');
    }

    return res.send(expeditionSnapshot.data());
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
});

app.get('/expeditions/:expeditionId/locationHistory', [
  query('date').isISO8601({ strict: true }).withMessage('Invalid date format. The ISO8601 format is required.').optional(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expeditionsQuery = firestore.collection('expeditions')
      .withConverter(expeditionConverter)
      .doc(req.params.expeditionId);
    const expeditionSnapshot = await expeditionsQuery.get();

    if (!expeditionSnapshot.exists) {
      return res.status(404).send('Expedition does not exist.');
    }

    const expedition = expeditionSnapshot.data();
    const timezone = findTimeZone(expedition.timezone);

    const fromSplit = expedition.from.split('-');
    const fromData = {
      year: Number(fromSplit[0]),
      month: Number(fromSplit[1]),
      day: Number(fromSplit[2]),
      hours: 0,
      minutes: 0,
    };
    const expeditionFrom = new Date(getUnixTime(fromData, timezone));

    const toSplit = expedition.to.split('-');
    const toData = {
      year: Number(toSplit[0]),
      month: Number(toSplit[1]),
      day: Number(toSplit[2]),
      hours: 23,
      minutes: 59,
    };
    const expeditionTo = new Date(getUnixTime(toData, timezone));

    let searchQuery = firestore.collection('locationHistory')
      .withConverter(locationHistoryConverter)
      .orderBy('timestamp', 'asc');

    if (req.query?.date) {
      const reqSplit = (req.query.date as string).split('T')[0].split('-');
      const reqData = {
        year: Number(reqSplit[0]),
        month: Number(reqSplit[1]),
        day: Number(reqSplit[2]),
        hours: 0,
        minutes: 0,
      };
      const reqDate = new Date(getUnixTime(reqData, timezone));

      if (
        expeditionFrom.getTime() > reqDate.getTime()
        || expeditionTo.getTime() < reqDate.getTime()
      ) {
        return res.status(404).send('The expedition was not active at the required date');
      }

      const to = new Date(reqDate);
      to.setDate(reqDate.getDate() + 1);
      searchQuery = searchQuery.where('timestamp', '>', Timestamp.fromDate(reqDate))
        .where('timestamp', '<', Timestamp.fromDate(to));
    } else {
      searchQuery = searchQuery.where('timestamp', '>', Timestamp.fromDate(expeditionFrom))
        .where('timestamp', '<', Timestamp.fromDate(expeditionTo))
        .where('messageType', '==', 'OK');
    }

    const locationQuery = await searchQuery.get();
    if (locationQuery.empty) {
      return res.status(204).send([]);
    }

    return res.send(locationQuery.docs.map((docSnapshot) => docSnapshot.data()));
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
});

app.get('/expeditions/:expeditionId/locationHistory/latest', async (req, res) => {
  try {
    const expeditionsQuery = firestore.collection('expeditions')
      .withConverter(expeditionConverter)
      .doc(req.params.expeditionId);
    const expeditionSnapshot = await expeditionsQuery.get();

    if (!expeditionSnapshot.exists) {
      return res.status(404).send('Expedition does not exist.');
    }

    const expedition = expeditionSnapshot.data();
    const timezone = findTimeZone(expedition.timezone);

    const fromSplit = expedition.from.split('-');
    const fromData = {
      year: Number(fromSplit[0]),
      month: Number(fromSplit[1]),
      day: Number(fromSplit[2]),
      hours: 0,
      minutes: 0,
    };
    const expeditionFrom = new Date(getUnixTime(fromData, timezone));

    const toSplit = expedition.to.split('-');
    const toData = {
      year: Number(toSplit[0]),
      month: Number(toSplit[1]),
      day: Number(toSplit[2]),
      hours: 23,
      minutes: 59,
    };
    const expeditionTo = new Date(getUnixTime(toData, timezone));

    const searchQuery = firestore.collection('locationHistory')
      .withConverter(locationHistoryConverter)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .where('timestamp', '>', Timestamp.fromDate(expeditionFrom))
      .where('timestamp', '<', Timestamp.fromDate(expeditionTo));

    const locationQuery = await searchQuery.get();
    if (locationQuery.empty) {
      return res.status(404).send('No location has ever been recorded for this expedition.');
    }

    return res.send(locationQuery.docs[0].data());
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

module.exports = app;
