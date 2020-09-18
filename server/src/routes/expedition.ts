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
    return res.send(res.locals.expedition);
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

router.get('/:expeditionId/locationHistory/latest', async (req, res) => {
  try {
    // eslint-disable-next-line prefer-destructuring
    const expedition: Expedition = res.locals.expedition;
    const point = await expeditionService.getLatestPoint(expedition);

    if (point === undefined) {
      return res.status(404).send('No location has ever been recorded for this expedition.');
    }

    return res.send(point);
  } catch (error) {
    console.error(error);
    return res.status(500).send(error.message);
  }
});

export default router;
