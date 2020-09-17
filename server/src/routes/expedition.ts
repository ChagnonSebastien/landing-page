import { Request, Response, Router } from 'express';
import { Timestamp } from '@google-cloud/firestore';
import { validationResult, query } from 'express-validator';
import { findTimeZone, getUnixTime } from 'timezone-support';
import { locationHistoryConverter } from '../LocationHistory';
import { expeditionConverter } from '../Expedition';
import FirestoreProvider from '../FirestoreProvider';

const router = Router();

router.get('/', async (_, res) => {
  try {
    const { firestore } = FirestoreProvider.get();
    const expeditionsQuery = firestore.collection('expeditions')
      .withConverter(expeditionConverter);
    const expeditionsSnapshot = await expeditionsQuery.get();

    return res.send(expeditionsSnapshot.docs.map((docSnapshot) => docSnapshot.data()));
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
});

router.get('/:expeditionId', async (req, res) => {
  try {
    const { firestore } = FirestoreProvider.get();
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

router.get('/:expeditionId/locationHistory', [
  query('date').isISO8601({ strict: true }).withMessage('Invalid date format. The ISO8601 format is required.').optional(),
], async (req: Request, res: Response) => {
  try {
    const { firestore } = FirestoreProvider.get();
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

router.get('/:expeditionId/locationHistory/latest', async (req, res) => {
  try {
    const { firestore } = FirestoreProvider.get();
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

export default router;
