import {
  NextFunction, Request, Response, Router,
} from 'express';
import { validationResult, query } from 'express-validator';

import { Expedition, expeditionConverter } from '../models/Expedition';
import FirestoreProvider from '../FirestoreProvider';
import * as expeditionService from '../services/expedition';

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

router.use('/:expeditionId', async (req: Request, res: Response, next: NextFunction) => {
  const { firestore } = FirestoreProvider.get();
  const expeditionsQuery = firestore.collection('expeditions')
    .withConverter(expeditionConverter)
    .doc(req.params.expeditionId);
  const expeditionSnapshot = await expeditionsQuery.get();

  if (!expeditionSnapshot.exists) {
    return res.status(404).send('Expedition does not exist.');
  }

  res.locals.expedition = expeditionSnapshot.data();
  return next();
});

router.get('/:expeditionId', async (req, res) => {
  try {
    // eslint-disable-next-line prefer-destructuring
    const expedition: Expedition = res.locals.expedition;
    const locationHistoryPromise = expeditionService.getAllPoints(expedition);
    const firstPointPromise = expeditionService.getFirstPoint(expedition);
    const lastPointPromise = expeditionService.getLatestPoint(expedition);
    const [
      locationHistory,
      firstPoint,
      lastPoint,
    ] = await Promise.all([locationHistoryPromise, firstPointPromise, lastPointPromise]);
    return res.send({
      expedition,
      locationHistory,
      firstPoint,
      lastPoint,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
});

router.get('/:expeditionId/locationHistory', [
  query('date').isISO8601({ strict: true }).withMessage('Invalid date format. The ISO8601 format is required.').optional(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // eslint-disable-next-line prefer-destructuring
    const expedition: Expedition = res.locals.expedition;
    const points = await expeditionService.getAllPoints(expedition, req.query?.date as string);
    return res.send(points);
  } catch (error) {
    console.error(error);

    if (error instanceof expeditionService.DateOutOfBounds) {
      return res.status(404).send(error.message);
    }

    return res.status(500).send(error);
  }
});

export default router;
