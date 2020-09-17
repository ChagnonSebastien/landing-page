import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { locationHistoryConverter } from './LocationHistory';
import FirestoreProvider from './FirestoreProvider';

import expeditionsRoute from './routes/expedition';

const app = express();

app.use(cors());
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method}:${req.url}`);
  next();
});

app.get('/version', (_, res) => res.send('v1.0.0'));

app.get('/spot/batteryState', async (_, res) => {
  try {
    const { firestore } = FirestoreProvider.get();
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

app.use('/expeditions', expeditionsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

module.exports = app;